docker-compose down
docker-compose up -d
sleep 1
npx prisma migrate dev