# Jalankan migration untuk membuat tabel announcements dan announcement_attachments
npm run migrate

# Atau jika menggunakan sequelize-cli langsung:
npx sequelize-cli db:migrate

# Cek apakah migration sudah berjalan dengan benar
npm run db:status