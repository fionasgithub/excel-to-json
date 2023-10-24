const fs = require('fs')

const directoryPath = 'source'

try {
  const files = fs.readdirSync(directoryPath)

  files.forEach((filename) => {
    if (filename.includes('各投開票所')) return

    const { excelToJson } = require('./excelToJson.js')

    const result = excelToJson({
      path: `source/${filename}`,
      isVillage: filename.includes('村里'),
    })

    const jsonContent = JSON.stringify(result, null, 2)
    fs.writeFileSync(`output/${filename.replace('.xls', '.json')}`, jsonContent)
  })
} catch (err) {
  console.error('Error reading directory:', err)
}
