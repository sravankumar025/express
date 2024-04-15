const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;
function unflattenAndDestringify(flattenedObject) {
    const result = {};
  
    for (const key in flattenedObject) {
      const value = flattenedObject[key];
      const keys = key.split('.');
  
      keys.reduce((acc, currentKey, index) => {
        const isArrayIndex = /\d+/.test(keys[index + 1]);
  
        if (isArrayIndex) {
          acc[currentKey] = acc[currentKey] || [];
        } else {
          acc[currentKey] = acc[currentKey] || {};
        }
  
        if (index === keys.length - 1) {
          try {
            acc[currentKey] = JSON.parse(value);
          } catch (err) {
            acc[currentKey] = value;
          }
        }
  
        return acc[currentKey];
      }, result);
    }
  
    return result;
  }
app.use(express.json());

async function getJsonFile(sourceDbConfig, schemaId) {
  try {
    const sourceConnection = await mysql.createConnection(sourceDbConfig);
    await sourceConnection.execute(`USE ${sourceDbConfig.database}`);

    const sourceTableName = `t_${schemaId}_t`;
    const [rows] = await sourceConnection.execute(`SELECT * FROM ${sourceTableName}`);

    if (!rows || rows.length === 0) {
      console.log('No data to migrate.');
      return[];
    }
console.log(rows)
    // Create directory if it doesn't exist


    // Create JSON file path
  

    console.log(`Data read successfully from source TiDB and saved as JSON file.`);

    await sourceConnection.end();
    return (rows)
  } catch (error) {
    console.error('Error reading data:', error);
    throw error;
  }
}
async function createJsonFile(sourceDbConfig,schemaId){
    try {
        const sourceConnection = await mysql.createConnection(sourceDbConfig);
        await sourceConnection.execute(`USE ${sourceDbConfig.database}`);
    
        const sourceTableName = `t_${schemaId}_t`;
        const [rows] = await sourceConnection.execute(`SELECT * FROM ${sourceTableName}`);
    
        if (!rows || rows.length === 0) {
          console.log('No data to migrate.');
          return;
        }
    
        // Create directory if it doesn't exist
        const directory = path.join(__dirname, 'migrated_data');
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory);
          console.log('Directory created:', directory);
        }
    
        // Create JSON file path
        const filePath = path.join(directory, `${sourceTableName}.json`);
    
        // Write data to JSON file
        fs.writeFile(filePath, JSON.stringify(rows), (err) => {
          if (err) {
            console.error('Error writing JSON file:', err);
          } else {
            console.log(`Data saved to ${filePath}`);
          }
        });
    
        console.log(`Data read successfully from source TiDB and saved as JSON file.`);
    
        await sourceConnection.end();
      } catch (error) {
        console.error('Error reading data:', error);
        throw error;
      }
}
app.post('/create-json-file', async (req, res) => {
  const schemaId = req.body.schemaId;
  const sourceDbConfig = {
    host: '192.168.28.10',
    port: 4000,
    user: 'root',
    password: '',
    database: 'targettingFramework'
  };

  try {
    await createJsonFile(sourceDbConfig, schemaId);
    res.send('JSON file creation completed successfully.');
  } catch (error) {
    console.error('Error creating JSON file:', error);
    res.status(500).send('Internal server error: ' + error.message);
  }
});
app.get("/getinstances",async (req, res) => {
    const schemaId = req.query.schemaId;
    const sourceDbConfig = {
      host: '192.168.28.10',
      port: 4000,
      user: 'root',
      password: '',
      database: 'targettingFramework'
    };
  
    try {
     let data= await getJsonFile(sourceDbConfig, schemaId);
     let unflattendata =data.map(dta=>{return unflattenAndDestringify(dta)?.entity})
      res.send({status:"SUCCESS",entities:unflattendata});
    } catch (error) {
      console.error('Error creating JSON file:', error);
      res.status(500).send('Internal server error: ' + error.message);
    }
  })
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
