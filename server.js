const http=require("http");
const fs=require("fs");
const path=require("path");
const { spawn }=require("child_process");

const uploadDir=path.join(__dirname,'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);


const server=http.createServer((req,res)=>{

    //POST REQUEST
    if(req.method==="POST" && req.url==="/upload"){
        let body="";
        req.on("data",chunk=> body+=chunk);
        req.once("end",()=>{
            const {filename,content}=JSON.parse(body);
            if(!filename || !content){
                res.writeHead(400);
                return res.end(JSON.stringify({message:"Upload Failed"}));
            }

            const filePath=path.join(uploadDir,filename);

            fs.writeFileSync(filePath,JSON.stringify(content,null,2),'utf-8');

            res.writeHead(201,{"Content-Type":"text/plain"});
            res.end(JSON.stringify({message:"File Uploaded successfully"}));
        })
    }

    //POST REQUEST
    if(req.method==="POST" && req.url==="/upload-multi-form-file"){
        const boundary=req.headers["content-type"].split("boundary=")[1];
        let body="";
        req.on("data",chunk=>body+=chunk.toString("binary"));
        req.on("end",()=>{
            const parts= body.split("--"+boundary); // this will divide each boundaries as different part in the req body
            const fileParts=parts.find((eachPart)=>eachPart.includes("filename="));
            if(!fileParts){
                res.writeHead(400);
                return res.end("No File Uploaded");
            }

            const match=fileParts.match(/filename="(.+?)"/);
            const filename=match ? match[1] : "file.unknown";

            const fileData=fileParts.split("\r\n\r\n")[1].split("\r\n")[0];
            const filePath=path.join(uploadDir,filename);

            fs.writeFile(filePath,fileData,"binary",err=>{
                if(err){
                    res.writeHead(500);
                    return res.end("Error saving file");
                }

                res.writeHead(200,{"Content-Type":"application/json"});
                res.end(JSON.stringify({message:"File uploaded",file:filename}));
            }); 
        });
    }

    //POST REQUEST
    if(req.method==="POST" && req.url==="/upload-multi-form-files"){
        const boundary=req.headers["content-type"].split("boundary=")[1];
        let body="";
        req.on("data",chunk=>body+=chunk.toString("binary"));
        req.on("end",()=>{
            const parts= body.split("--"+boundary); // this will divide each boundaries as different part in the req body
            const fileParts=parts.filter((eachPart)=>eachPart.includes("filename=")) || [];
            if(!fileParts?.length){
                res.writeHead(400);
                return res.end("No File Uploaded");
            }

            const uploadedFiles=[];
            fileParts?.forEach((eachFile)=>{
                const match=eachFile.match(/filename="(.+?)"/);
                const filename=match ? match[1] :`file.${Date.now()}`;
                const fileDataMatch=eachFile.match(/\r\n\r\n([\s\S]*?)$/);
                console.log({fileDataMatch,match,eachFile});
                if(!fileDataMatch) return;

                let fileData=fileDataMatch[1];
                fileData=fileData.replace(/\r\n--$/,"").trim();
                const filePath=path.join(uploadDir,filename);
                console.log({fileData})
                fs.writeFile(filePath,fileData,"binary",err=>{
                    if(err){
                        res.writeHead(500);
                        return res.end("Error saving file");
                    }
                }); 
                uploadedFiles.push(filename);
            })

            
            res.writeHead(200,{"Content-Type":"application/json"});
            res.end(JSON.stringify({message:"Files uploaded",files:uploadedFiles}));
        });
    }
    
    // GET REQUEST
    else if(req.method==="GET" && req.url==="/files"){
        const files=fs.readdirSync(uploadDir);
        res.writeHead(200);
        res.end(JSON.stringify(files));
    } 
    
    // GET REQUEST
    else if(req.method==="GET" && req.url.startsWith("/file")){
        const url=new URL(req.url,`http://${req.headers.host}`);
        const filename=url.searchParams.get("file");
        if(!filename){
            res.writeHead(400);
            return res.end("File name is required");
        }
        const filePath=path.join(uploadDir,filename);
        if(!fs.existsSync(filePath)){
            res.writeHead(404);
            return res.end("file not found");
        }
        
        const file=fs.readFileSync(filePath); // return buffer need to chnage it toString()
        const stringifiedBufferContent=file.toString();
        const parsedContent=JSON.parse(stringifiedBufferContent);
        res.writeHead(200);
        res.end(JSON.stringify({filename,content:parsedContent},null,2)); // <-- this pretty prints the JSON

    }


    //GET REQUEST
    else if(req.method==="GET" && req.url.startsWith("/download-folder")){
        const archiverName="archive.tar.gz";
        const archiverPath=path.join(__dirname,archiverName);

        const tar=spawn("tar",["-czf",archiverPath,"uploads"]);

        tar.on("close",(code)=>{
            if(code!==0){
                res.writeHead(500);
                return res.end("Internal Server Error While Downloading folder");
            }

            res.writeHead(200,{
                "Content-Disposition":`attachemnt; filename="${archiverName}"`,
                "Content-Type":"application/gzip",
            });

            const readStream=fs.createReadStream(archiverPath);
            readStream.pipe(res);
            readStream.on("error",()=>{
                res.writeHead(400);
                return res.end("Error while reading stream in folder download");
            })

            readStream.on("end",()=>{
                fs.unlinkSync(archiverPath); //--> this to clean up the file which we created while downloading the folder for temporary usage
            })
        })
    }
    
    
    //GET REQUEST
    else if(req.method==="GET" && req.url.startsWith("/download")){
        const url=new URL(req.url,`http://${req.headers.host}`);
        const filename=url.searchParams.get("file");
        if(!filename){
            res.writeHead(400);
            return res.end("File Name required");
        }
        const filePath=path.join(uploadDir,filename);
        if(!fs.existsSync(filePath)){
            res.writeHead(404);
            return res.end("File not found");
        }

        res.writeHead(200,{
            "Content-Disposition":`attachment; filename="${filename}"`,
            "Content-Type":"application/octet-stream"
        });

        const fileStream=fs.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on("error",()=>{
            res.writeHead(400,{"Content-Type":"application/json"});
            return res.end("File Stream Error");
        });

    }
    
    //DELETE REQUEST
    else if(req.method==="DELETE" && req.url?.startsWith("/delete")){
        const url= new URL(req.url,`http://${req.headers.host}`);
        console.log(url.searchParams,"url");
        const name=url.searchParams.get("file");
        if(!name){
            res.writeHead(400);
            return res.end("File Name requried");
        }

        const filePath=path.join(uploadDir,name);
        if(!fs.existsSync(filePath)){
            res.writeHead(404);
            return res.end("File not found");
        }

        fs.unlinkSync(filePath);
        res.writeHead(200);
        res.end("File Deleted Successfully");
    }


    //NOT FOUND
    else{
        res.writeHead(404,{
            "content-type":"text/plain",
        });
        res.end("Route Not Found");
    }
});

server.listen(5000,()=> console.log("Server running at port 5000"));