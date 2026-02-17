---
name: schema-change
description: Update Prisma schema + migrate + regenerate client
---
npx prisma format
npx prisma migrate dev
npx prisma generate
