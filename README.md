
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
* Using fs.reaFile and fs.writeFile sync and async
* Manual `multipart/form-data` parsing (without `formidable`, `busboy`, or `multer`)
* Handling raw file buffers and writing them using `fs`
* Using `child_process.spawn()` to call Linux commands like `tar`
* Using `Content-Disposition` for downloads
* `URL` class for parsing query params

---

## 🚀 To Run

```bash
node server.js
```

Server starts at: `http://localhost:5000`

Here’s a **structured point-wise explanation** of the core Node.js file server functionalities, specifically focusing on:

* 🔽 Downloading single file
* 📦 Downloading whole folder
* ⬆️ Uploading single file (multipart/form-data)
* ⬆️ Uploading multiple files (multipart/form-data)

---

## 🔽 1. Download Single File

**Route:** `GET /download?file=filename.ext`

### ✅ How It Works:

1. Extracts `filename` from query param using `URL` API.
2. Checks if file exists using `fs.existsSync`.
3. Sends file as a downloadable stream:

   * Sets headers:

     * `"Content-Disposition": attachment; filename="filename.ext"`
     * `"Content-Type": application/octet-stream"`
4. Streams file with `fs.createReadStream(filePath).pipe(res)`.
5. Handles stream error with `fileStream.on("error")`.

---

## 📦 2. Download Entire Folder as Archive

**Route:** `GET /download-folder`

### ✅ How It Works:

1. Defines archive name: `"archive.tar.gz"` using `.tar.gz` format.
2. Uses Node's `spawn()` from `child_process` to run Linux shell command:

   ```bash
   tar -czf archive.tar.gz uploads/
   ```

   * `-c`: create
   * `-z`: gzip compression
   * `-f`: output filename
3. On `close` event of tar process:

   * Sets download headers:

     * `"Content-Disposition": attachment; filename="archive.tar.gz"`
     * `"Content-Type": application/gzip"`
   * Streams archive file using `fs.createReadStream`.
   * Deletes the `.tar.gz` file from disk after stream ends (`fs.unlinkSync()`).

> ⚠️ Works only if `tar` is available (Linux/macOS/WSL/Git Bash).

---

## ⬆️ 3. Upload Single File (multipart/form-data)

**Route:** `POST /upload-multi-form-file`

### ✅ How It Works:

1. Extracts `boundary` from `Content-Type` header.
2. Reads raw body as `"binary"` using `req.on("data")`.
3. Splits body using boundary into parts.
4. Finds the part that includes `filename=`.
5. Uses RegEx to extract:

   * `filename`
   * Binary file data after 4 line breaks (`\r\n\r\n`)
6. Writes file using `fs.writeFile(path, data, "binary")`.

> This handles exactly **one file** per request.

---

## ⬆️ 4. Upload Multiple Files (multipart/form-data)

**Route:** `POST /upload-multi-form-files`

### ✅ How It Works:

1. Same as above: parse `boundary` and raw binary body.
2. Filters all parts where `filename=` exists → multiple parts.
3. Loops through all `parts`:

   * Extracts filename: `filename="..."`.
   * Uses RegEx to extract file binary:

     ```js
     fileDataMatch = part.match(/\r\n\r\n([\s\S]*?)$/);
     ```
   * Trims off boundary ending using `replace(/\r\n--$/, "")`.
4. Saves each file using `fs.writeFile(path, binary)`.

> Allows multiple files from a single form-data request.

---

## 🧠 Differences Summary

| Feature              | Single File Upload          | Multiple File Upload          |
| -------------------- | --------------------------- | ----------------------------- |
| Route                | `/upload-multi-form-file`   | `/upload-multi-form-files`    |
| Parts handling       | `find()` → single part      | `filter()` → all parts        |
| File data extraction | Simple split by `\r\n\r\n`  | Regex to match until boundary |
| Filename handling    | Regex from `filename="..."` | Same                          |
| Loop used            | None / Single write         | `forEach()` loop              |
| Edge Cases           | Missing filename/file check | Checks per file               |

---

## 🧪 Bonus Learnings (from this project)

* How `multipart/form-data` is structured in raw body.
* Why boundaries are needed in file uploads.
* When to use `binary` encoding.
* Difference between `fs.readFileSync`, `fs.createReadStream`, and streaming pipes.
* How to download large folders using `tar` archive + stream.

---


