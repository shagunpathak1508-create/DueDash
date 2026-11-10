
package com.duedash;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    private static final String URL =
        "jdbc:mysql://localhost:3306/due_dash";

    private static final String USER = "root";

    // Enter the new MySQL root password you created
    private static final String PASSWORD = "Sha12*08";
public static Connection getConnection() throws SQLException {
    try {
        Class.forName("com.mysql.cj.jdbc.Driver");
    } catch (ClassNotFoundException e) {
        throw new SQLException("MySQL JDBC Driver not found!", e);
    }

    return DriverManager.getConnection(URL, USER, PASSWORD);
}

    

    // Temporary connection test
    public static void main(String[] args) {

        try (Connection con = getConnection()) {

            System.out.println("Database connected successfully!");
            System.out.println("Connection: " + !con.isClosed());

        } catch (SQLException e) {

            System.out.println("Database connection failed!");
            e.printStackTrace();

        }
    }
}
