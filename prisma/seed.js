// Seed = "mock user log" sourced from Microtuff Solutions client database.
// These phone numbers are the ones clients use to log in (no OTP — direct match).
//
// Real client entries (add more as needed):
//   +18768851041  Nash Tech        (admin-capable)
//   +15559876543  Natoya Daley
//   +18765551234  Garlands Wholesale
//   +18765552345  Client Two
//   +19095550001  Client Three
//
// Phone format: stored WITH country code (+1 for US/Jamaica). The login form
// auto-prepends +1 if the user types a 10-digit local number.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

function makeClientFolder(phone) {
  const safe = String(phone).replace(/[^a-zA-Z0-9]/g, '_')
  const dir = path.resolve(process.env.UPLOAD_DIR || './uploads', safe)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// CLIENT_DATABASE — replace / extend with your real client records.
const CLIENT_DATABASE = [
  { phone: '+18768851041', name: 'Nash Tech', isAdmin: true },
  { phone: '+15559876543', name: 'Natoya Daley' },
  { phone: '+18765551234', name: 'Garlands Wholesale' },
  { phone: '+18765552345', name: 'Client Two' },
  { phone: '+19095550001', name: 'Client Three' },
]

async function main() {
  for (const u of CLIENT_DATABASE) {
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: { name: u.name, isAdmin: u.isAdmin },
      create: u,
    })
    // Always create the client's isolated project folder.
    const dir = makeClientFolder(u.phone)
    console.log(`  ${u.phone}  ${u.name}${u.isAdmin ? '  [ADMIN]' : ''}  ->  ${dir}`)
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
