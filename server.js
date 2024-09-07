const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
require('dotenv').config();

const app = express();

// Middleware to extract info from the HTML
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.send(
    '<body style="background-color: bisque;" ><h3>The server is running ...</h3></body>'
  )
);


// Database connection
const connection = mysql.createConnection({
  user: process.env.USER, 
  password: process.env.PASSWORD,
  host: process.env.HOST,
  database: process.env.DATABASE,
  port: process.env.PORT
});


connection.connect((err) => {
  if (err) console.log(err)
  else console.log("Connected to MySQL");
});


// table create api

app.get("/install", (req, res) => {
  let name = `CREATE TABLE if not exists customers(
      customer_id int auto_increment, 
      name VARCHAR(255) not null, 
      PRIMARY KEY (customer_id)
  )`;

  let address = `CREATE TABLE if not exists address(
      address_id int auto_increment, 
      customer_id int(11) not null, 
      address VARCHAR(255) not null, 
      PRIMARY KEY (address_id), 
      FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
  )`;

  let company = `CREATE TABLE if not exists company(
      company_id int auto_increment, 
      customer_id int(11) not null, 
      company VARCHAR(255) not null,
      PRIMARY KEY (company_id), 
      FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
  )`;

  connection.query(name, (err) => {
      if (err) {
          console.log(`Error Found: ${err}`);
          return res.status(500).send("Error creating customers table.");
      }
      console.log("Customer name table created");

      connection.query(address, (err) => {
          if (err) {
              console.log(`Error Found: ${err}`);
              return res.status(500).send("Error creating address table.");
          }
          console.log("Address table created");

          connection.query(company, (err) => {
              if (err) {
                  console.log(`Error Found: ${err}`);
                  return res.status(500).send("Error creating company table.");
              }
              console.log("Company table created");

              // If all queries are successful, send the response
              console.log("All Tables Created");
              res.status(200).send("Tables Created Successfully");
          });
      });
  });
});


// route to insert data
app.post("/insert-customer-data", (req, res) => {
  const { name, address, company } = req.body; 

  // Insert into customers name table
  let insertName = `INSERT INTO customers (name) VALUES (?)`;

  connection.query(insertName, [name], (err) => {
      if (err) {
          console.log(`Error Found: ${err}`);
          return res.status(500).send("Error inserting customer name.");
      }
      console.log("Name inserted");

      // Getting customer_id column data
      connection.query(`SELECT * FROM customers WHERE name = ?`, [name], (err, rows) => {
          if (err) {
              console.log(err);
              return res.status(500).send("Error retrieving customer ID.");
          }

          let nameAdded_id = rows[0].customer_id;

          // Insert into address table
          let insertAddress = `INSERT INTO address (customer_id, address) VALUES (?, ?)`;
          connection.query(insertAddress, [nameAdded_id, address], (err) => {
              if (err) {
                  console.log(`Error Found: ${err}`);
                  return res.status(500).send("Error inserting address.");
              }
              console.log("Address inserted");

              // Insert into company table
              let insertCompany = `INSERT INTO company (customer_id, company) VALUES (?, ?)`;
              connection.query(insertCompany, [nameAdded_id, company], (err) => {
                  if (err) {
                      console.log(`Error Found: ${err}`);
                      return res.status(500).send("Error inserting company.");
                  }
                  console.log("Company inserted");

                  // All queries successful, send the response
                  res.status(200).send("Data inserted to tables successfully.");
                  console.log("Data inserted to tables");
              });
          });
      });
  });
});



// route to retrive or get ALL customer, adress and company data 
app.get("/customers", (req, res) =>{

  const customersQuery  =  `SELECT
  customers.customer_id AS ID, 
  customers.name, 
  address.address, 
  company.company 
  FROM customers 
  JOIN address 
  ON customers.customer_id = address.customer_id 
  JOIN company
  ON customers.customer_id = company.customer_id`


  connection.query(customersQuery, (err, results) => {
    if (err) console.log("Error During selection", err)
    else res.send(results);
  }
);

})

// route retrive single customer data by ID
app.get("/customers/:id", (req, res) => {
  // console.log(req)

  let selectCustomers = `SELECT 
  customers.customer_id AS ID,
  customers.name
  FROM customers WHERE customers.customer_id = ${req.params.id}`

  connection.query(selectCustomers, (err, customerResults) => {
      if (err) console.log("Error During selection", err);

    // console.log(customerResults)

    let selectAdress = `SELECT 
    address.address 
    FROM address WHERE address.customer_id = ${req.params.id}`

      connection.query(selectAdress, (err, addressResults) => {
          if (err) console.log("Error During selection", err);

          // console.log(addressResults)
  
    let selectCompany = `SELECT 
    company.company 
    FROM company WHERE company.customer_id = ${req.params.id}`

          connection.query(selectCompany, (err, companyResults) => {
              if (err) console.log("Error During selection", err);


              // continue for the next table

              // console.log(companyResults)
              res.send(
                {
                id: customerResults[0]?.ID,
                name: customerResults[0]?.name,
                address: addressResults[0]?.address,
                company: companyResults[0]?.company,
              }
            );
            }
          );
        }
      );
    }
  );
});


// Route to update a customer's data
app.put("/update", (req, res) => {
  
  const { newName, newAddress, newCompany, id } = req.body;

  // console.log(newName)

  const updateCustomerQuery = `UPDATE customers SET name = ? WHERE customer_id = ?`;

  const updateAddressQuery = `UPDATE address SET address = ? WHERE customer_id = ? `;

  const updateCompanyQuery = `UPDATE company SET company = ? WHERE customer_id = ?`;

  // Execute all update queries sequentially
  connection.query(updateCustomerQuery, [newName, id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating customer name.");
    } else console.log(results)

    connection.query(updateAddressQuery, [newAddress, id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error updating address.");
      } else {
        console.log(results)
      }

      connection.query(updateCompanyQuery, [newCompany, id], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error updating company.");
        } else {
          console.log(results)
        }

        console.log("Customer updated successfully.");
        res.status(200).send("Customer updated successfully!");
      });
    });
  });
});


// Route to delete a customer
app.delete("/remove-user", (req, res) => {

  const { id } = req.body;

  // Query strings
  let removeName = `DELETE FROM customers WHERE customer_id = ?`;
  let removeAddress = `DELETE FROM address WHERE customer_id = ?`;
  let removeCompany = `DELETE FROM company WHERE customer_id = ?`;

  // Execute queries
  connection.query(removeAddress, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting address.");
    }
    console.log(result.affectedRows + " address record(s) Deleted");
  });

  connection.query(removeCompany, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting company.");
    }
    console.log(result.affectedRows + " company record(s) Deleted");
  });

  connection.query(removeName, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting customer.");
    }
    console.log(result.affectedRows + " customer record(s) Deleted");
  });

  res.send("Customer deleted");
});


const port = 2024;
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));

