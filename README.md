
# 📁 Node.js File Upload and Download Server (No Express, No DB)

This is a **core Node.js project** that implements file upload, download, read, delete, and folder archive features — **without using Express or any third-party frameworks** (except `tar` for archiving). It helps you master the use of:

* **`http`, `fs`, `path`, `URL`, `child_process.spawn`**
* Manual handling of **raw request streams**
* Understanding of **multipart/form-data** and buffer parsing
* Core file system operations (read, write, delete, list) for uploading , downloading and reading , deletign files
* Downloading folder using Archiving with `tar` using Node.js built-in modules

---

## Features

### ✅ Upload a JSON File (Raw Body)

**Route:** `POST /upload`
**Payload:** JSON body

```json
{
  "filename": "task.json",
  "content": {
    "title": "Some Task",
    "status": "pending"
  }
}
```

---

### ✅ Upload Single File (via multipart/form-data)

**Route:** `POST /upload-multi-form-file`
Upload one file using form-data. It manually parses the boundary and writes the file using `fs.writeFile()`.

---

### ✅ Upload Multiple Files (multipart/form-data)

**Route:** `POST /upload-multi-form-files`
Handles multiple files in a single form-data request. Extracts filenames and binary content manually using regex.

---

### ✅ List All Uploaded Files

**Route:** `GET /files`
Returns a list of filenames from the `/uploads` directory.

---

### ✅ Read a File as JSON

**Route:** `GET /file?file=filename.json`
Reads the uploaded file from disk and parses it back into JSON.

---

### ✅ Download a File

**Route:** `GET /download?file=filename.ext`
Streams a file back as a downloadable attachment using `fs.createReadStream()`.

---

### ✅ Download Entire Uploads Folder as `.tar.gz`

**Route:** `GET /download-folder`
Uses the `tar` command (via `spawn`) to compress the `uploads/` folder and send it for download.

> ⚠️ Works on Linux/macOS/WSL/Git Bash (with `tar` installed).

---

### ✅ Delete a File

**Route:** `DELETE /delete?file=filename.ext`
Deletes a specified file from `/uploads` using `fs.unlinkSync()`.

---

## 📦 Folder Structure

```bash
.
├── uploads/           # Uploaded files are saved here
├── server.js          # All routes handled with core Node.js
```

---

## 💡 Key Concepts Practiced

* Manual `multipart/form-data` parsing (without `formidable`, `busboy`, or `multer`)
* Handling raw file buffers and writing them using `fs`
* Using `child_process.spawn()` to call Linux commands like `tar`
* Clean MVC-like separation, even without frameworks
* Using `Content-Disposition` for downloads
* `URL` class for parsing query params

---

## 🚀 To Run

```bash
node server.js
```

Server starts at: `http://localhost:5000`

