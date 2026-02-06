import * as readline from 'readline';
import * as mysql from 'mysql';
import { spawn } from 'child_process';
import * as https from 'https';

// environment variables so credentials are not visible.
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// added input validation and implemented into user input.
function validateInput(input: string): boolean {
    const regex = /^[a-zA-Z0-9\s]{1,50}$/;
    return regex.test(input);
}

function getUserInput(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Enter your name: ', (answer) => {
            rl.close();
            if (validateInput(answer)) {
                resolve(answer);
            }
            else {
                console.error("Invalid input. Only alphanumeric and spaces allowed.");
                resolve("");
            }
        });
    });
}

function sendEmail(to: string, subject: string, body: string) {
    const echo = spawn('echo', [body]);
    const mail = spawn('mail', ['-s', subject, to]);
    echo.stdout.pipe(mail.stdin);

     mail.on('close', (code) => {
        if (code !== 0) console.error(`Mail failed with code ${code}`);
    });
}

// switched to https from http
function getData(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get('https://secure-api.com/get-data', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function saveToDb(data: string) {
    const connection = mysql.createConnection(dbConfig);
    const query = `INSERT INTO mytable (column1, column2) VALUES (?, ?)`;
    const values = [data, 'Another Value']; 
    // use prepared statement
    connection.connect();
    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
        } else {
            console.log('Data saved');
        }
        connection.end();
    });
}

(async () => {
    const userInput = await getUserInput();
    const data = await getData();
    saveToDb(data);
    if (userInput) {
        sendEmail('admin@example.com', 'User Input', userInput);
    }
    
})();