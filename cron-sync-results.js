const targetUrl = process.env.CRON_TARGET_URL;
const secret = process.env.CRON_SECRET;

async function main() {
  if (!targetUrl) {
    console.error('Missing CRON_TARGET_URL');
    process.exit(1);
  }

  if (!secret) {
    console.error('Missing CRON_SECRET');
    process.exit(1);
  }

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  const body = await response.text();

  console.log('Status:', response.status);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Cron sync failed:', error);
  process.exit(1);
});
