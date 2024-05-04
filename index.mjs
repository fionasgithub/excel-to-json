import { storeValueToOutput } from './excelToJson.mjs'
import { generateAdministrativeArea } from './administrative_area.mjs'
export { findAreaDiff } from './administrative_area/comparison.mjs'
export { generateCandidate } from './candidate.mjs'

const electionYears = ['2012', '2016', '2020']

export function generateVotes() {
  for (const year of electionYears) {
    storeValueToOutput(year)
  }
}

export function generateSelector() {
  for (const year of electionYears) {
    generateAdministrativeArea(year)
  }
}
