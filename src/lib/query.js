import mysql from 'mysql2'


export default function Query() {

    const connection = mysql.createConnection({
        user: 'root', 
        database: 'project_manager',
        password:'admin'
    });

  return connection
}

