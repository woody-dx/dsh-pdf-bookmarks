import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
function pdf(withOutline){
 const objects=[
 '<< /Type /Catalog /Pages 2 0 R '+(withOutline?'/Outlines 10 0 R /Names << /Dests << /Names [(third) [7 0 R /XYZ null 650 null]] >> >>':'')+' >>',
 '<< /Type /Pages /Kids [3 0 R 5 0 R 7 0 R] /Count 3 >>',
 '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 700] /Resources << /Font << /F1 9 0 R >> >> /Contents 4 0 R >>',
 stream('Chapter One: Introduction'),
 '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 700] /Resources << /Font << /F1 9 0 R >> >> /Contents 6 0 R >>',
 stream('Chapter Two: Implementation'),
 '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 700] /Resources << /Font << /F1 9 0 R >> >> /Contents 8 0 R >>',
 stream('Chapter Three: Validation'),
 '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
 '<< /Type /Outlines /First 11 0 R /Last 13 0 R /Count 3 >>',
 '<< /Title (Chapter One) /Parent 10 0 R /Dest [3 0 R /Fit] /Next 13 0 R /First 12 0 R /Last 12 0 R /Count 1 >>',
 '<< /Title (Section Two) /Parent 11 0 R /Dest [5 0 R /XYZ null 650 null] >>',
 '<< /Title (Chapter Three) /Parent 10 0 R /Prev 11 0 R /Dest (third) >>'];
 let out='%PDF-1.7\n',offsets=[0];objects.forEach((value,i)=>{offsets.push(Buffer.byteLength(out));out+=`${i+1} 0 obj\n${value}\nendobj\n`});
 const start=Buffer.byteLength(out);out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;return out;
}
function stream(label){const content=`BT /F1 20 Tf 40 650 Td (${label}) Tj 0 -48 Td (Selectable text for bookmark navigation.) Tj ET`;return `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`}
writeFileSync('test/book.pdf',pdf(true));writeFileSync('test/plain.pdf',pdf(false));
await build({entryPoints:['test/harness.jsx'],bundle:true,format:'esm',target:'chrome130',outfile:'test/harness.js'});
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta charset="utf-8"><title>PDF 书签插件验收</title><style>html,body{margin:0;height:100%;background:#edf0f4}#app{height:100%;max-width:1100px;margin:auto}</style><div id="app"></div><script type="module" src="/test/harness.js"></script>')}
 const file=pathname.slice(1);if(file.includes('..')){res.writeHead(403);return res.end()}
 try {res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.pdf')?'application/pdf':'text/plain');res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}
});
server.listen(58480,'127.0.0.1',()=>console.log('HARNESS http://127.0.0.1:58480'));
