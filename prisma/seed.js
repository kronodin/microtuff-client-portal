// Seed = "mock user log" sourced from Microtuff Solutions client database.
// These phone numbers are the ones clients use to log in (no OTP — direct match).
//
// Real client entries (add more as needed):
//   +18768851041  Nash Tech        (real client — can upload)
//   +15559876543  Natoya Daley
//   +18765551234  Garlands Wholesale
//   +18765552345  Client Two
//   +19095550001  Client Three
//
// Phone format: stored WITH country code (+1 for US/Jamaica). The login form
// auto-prepends +1 if the user types a 10-digit local number.
// The ADMIN_PHONE in .env designates who gets admin access (not set here).

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

// Load .env so ADMIN_PHONE is honoured at seed time.
require('fs').readFileSync && (() => {
  try {
    const env = require('fs').readFileSync(require('path').resolve(__dirname, '../.env'), 'utf8')
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
})()

// Admin is whoever matches ADMIN_PHONE in .env (not hard-coded here).
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').replace(/[^+\d]/g, '')

function makeClientFolder(phone) {
  const safe = String(phone).replace(/[^a-zA-Z0-9]/g, '_')
  const dir = path.resolve(process.env.UPLOAD_DIR || './uploads', safe)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// CLIENT_DATABASE — replace / extend with your real client records.
// No client is admin here; admin is granted via ADMIN_PHONE in .env.
const CLIENT_DATABASE = [
  { phone: '+17705803927', name: 'Microtuff Admin' },
  { phone: '+18768851041', name: 'Nash Tech' },
  { phone: '+15559876543', name: 'Natoya Daley' },
  { phone: '+18765551234', name: 'Garlands Wholesale' },
  { phone: '+18765552345', name: 'Client Two' },
  { phone: '+19095550001', name: 'Client Three' },
]

async function main() {
  for (const u of CLIENT_DATABASE) {
    const isAdmin = u.phone.replace(/[^+\d]/g, '') === ADMIN_PHONE
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: { name: u.name, isAdmin },
      create: { ...u, isAdmin },
    })
    // Always create the client's isolated project folder.
    const dir = makeClientFolder(u.phone)
    console.log(`  ${u.phone}  ${u.name}${isAdmin ? '  [ADMIN]' : ''}  ->  ${dir}`)
  }
  console.log('Seeded client log. Each client has an isolated uploads/<phone>/ folder.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
