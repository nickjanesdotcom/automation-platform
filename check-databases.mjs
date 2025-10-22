import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function checkDatabase(databaseId, name) {
  console.log(`\n=== ${name} Database ===`);
  console.log(`ID: ${databaseId}`);
  
  try {
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log('\nProperties:');
    for (const [propName, prop] of Object.entries(db.properties)) {
      console.log(`  - ${propName}: ${prop.type}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

await checkDatabase('24ebe0496f4c4b0d98fb13cdd2d779aa', 'Companies');
await checkDatabase('2221814366fe4930bb258b0aadda8458', 'People');
await checkDatabase('ce5fcc18a78e4b3e97851cb9edd5d346', 'Leads');
