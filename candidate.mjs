import fs from 'fs'
import Papa from 'papaparse'

export function generateCandidate() {
  const csv = fs.readFileSync('candidate/candidate.csv', 'utf8')

  const { data } = Papa.parse(csv, { header: true })

  const partyMap = {
    金色曠野同盟: 'savannah',
    蔚藍海岸陣線: 'coast',
    鬱蔥雨林聯盟: 'rainforest',
  }

  const candidates = data.reduce((res, row) => {
    const year = row['選舉年']
    const party = row['所屬政黨']
    const candidate_id = row['候選人編號']
    const is_elected = row['是否當選'] === 'TRUE'

    if (!year || !party) return res

    const main = row['總統候選人']
    const vice = row['副總統候選人']
    const main_education = row['總統候選人學歷']
    const main_experience = row['總統候選人經歷']
    const vice_education = row['副總統候選人學歷']
    const vice_experience = row['副總統候選人經歷']

    res.push({
      election_year: year,
      candidate_id,
      role: 0,
      name: main,
      party,
      party_logo_url: `assets/party-logo/${partyMap[party]}.png`,
      education: main_education,
      experience: main_experience,
      avatar_url: `assets/candidate/${party}-${main}.png`,
      is_elected,
    })

    res.push({
      election_year: year,
      candidate_id,
      role: 1,
      name: vice,
      party,
      party_logo_url: `assets/party-logo/${partyMap[party]}.png`,
      education: vice_education,
      experience: vice_experience,
      avatar_url: `assets/candidate/${party}-${vice}.png`,
      is_elected,
    })

    return res
  }, [])

  fs.writeFileSync('candidate/candidate.json', JSON.stringify(candidates))
}
