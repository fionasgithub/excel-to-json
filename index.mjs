import { storeValueToOutput } from './excelToJson.mjs'

const electionYears = ['2012', '2016', '2020']

for (const year of electionYears) {
  storeValueToOutput(year)
}
