const {digg} = require("@kaspernj/object-digger")
const fs = require("fs").promises
const fsOriginal = require("fs")
const path = require("path")
const allowedFilesTypes = [".abw", ".class", ".csv", ".doc", ".docx", ".eml", ".java", ".jpg", ".jpeg", ".gnumeric", ".mov", ".mp3", ".mp4", ".odt", ".pem", ".pdf", ".png", ".psd", ".rtf", ".sh", ".txt", ".xcf", ".xlsx", ".xml", ".zip"]
const excludedFilesTypes = [".gdoc", ".gdraw", ".gform", ".gsheet", ".gslides", ".gtable"]
const deletedFileNames = [".DS_Store"]

class CompareFolders {
  constructor(path1, path2) {
    this.path1 = path1
    this.path2 = path2
  }

  async compare() {
    const files = await fs.readdir(this.path1)

    for (const file of files) {
      const extName = path.extname(file)?.toLowerCase()
      const file1Path = `${this.path1}/${file}`
      const file2Path = `${this.path2}/${file}`

      if (file1Path == file2Path) {
        throw new Error(`Paths were identical '${file1Path}' '${file2Path}'`)
      }

      const file1Stat = await fs.lstat(file1Path)

      if (file1Stat.isFile() && extName) {
        if (excludedFilesTypes.includes(extName)) {
          // console.log("Skipping excluded file type", {file, extName})
          continue
        }

        /*
        if (!allowedFilesTypes.includes(extName)) {
          console.log("Skipping file type", {file, extName})
          continue
        }
        */
      }

      let file2Stat

      if (fsOriginal.existsSync(file2Path)) {
        file2Stat = await fs.lstat(file2Path)
      }

      if (deletedFileNames.includes(file)) {
        console.log("Deleting files", {file1Path, file2Path})

        await fs.unlink(file1Path)

        if (file2Stat) {
          await fs.unlink(file2Path)
        }

        continue
      }

      if (!fsOriginal.existsSync(file2Path)) {
        console.log(`file2Path didn't exist: ${file2Path}`)

        // await fs.copyFile(file1Path, file2Path)
        // await fs.unlink(file1Path)
      } else if (file1Stat.isDirectory() && file2Stat.isDirectory()) {
        console.log(`Is directory: ${file1Path}`)

        const subCompare = new CompareFolders(file1Path, file2Path)

        await subCompare.compare()

        if (await this.isDirEmpty(file1Path)) {
          console.log(`Deleting empty dir: ${file1Path}`)
          await fs.rmdir(file1Path)
        }
      } else if (file1Stat.isFile() && file2Stat.isFile()) {
        const file1Content = await fs.readFile(file1Path)
        const file2Content = await fs.readFile(file2Path)

        const file1Length = file1Content.length
        const file2Length = file2Content.length

        if (file1Content.equals(file2Content) && file1Length == file2Length) {
          console.log(`Files were identical: ${file1Path}`, {file1Length, file2Length})
          await fs.unlink(file1Path)
        } else {
          console.log(`Files wasn't the same: ${file1Path}`, {file1Length, file2Length})
        }
      }
    }
  }

  async fileState(path) {
    try {
      return await fs.lstat(path)
    } catch (error) {
      return null
    }
  }

  async isDirEmpty(path) {
    const files = await fs.readdir(path)
    const filesLength = digg(files, "length")

    console.log(`File count in: ${path}: ${filesLength}`)

    if (filesLength == 0) {
      return true
    } else {
      return false
    }
  }
}

const compareFolders = new CompareFolders("/Users/kaspernj/Google Drive/Google Photos", "/Users/kaspernj/Dropbox/Pictures/Google Photos")

compareFolders.compare().then(() => {
  console.log("Done!")
})
