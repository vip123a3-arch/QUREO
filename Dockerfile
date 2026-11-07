FROM node:18-slim

# تثبيت المتطلبات الضرورية لتشغيل Playwright على السيرفرات
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libdbus-1-3 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libnspr4 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext1 libxfixes1 \
    libxi1 libxrandr1 libxrender1 libxss1 libxtst1 ca-certificates \
    fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget

WORKDIR /app
COPY package*.json ./
RUN npm install

# تثبيت متصفح Chromium الخاص بـ Playwright داخل النظام
RUN npx playwright install chromium

COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
