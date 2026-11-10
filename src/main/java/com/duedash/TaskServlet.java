
package com.duedash;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

@WebServlet("/tasks")
public class TaskServlet extends HttpServlet {

    private final Gson gson = new Gson();

    // READ: Fetch all tasks from database
    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<Map<String, Object>> tasks = new ArrayList<>();

        String sql = "SELECT * FROM task ORDER BY id DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {

                Map<String, Object> task = new HashMap<>();

                task.put("id", rs.getInt("id"));
                task.put("title", rs.getString("title"));
                task.put("subject", rs.getString("subject"));
                task.put("type", rs.getString("type"));

                java.sql.Date dueDate = rs.getDate("due_date");

                task.put("deadline",
                    dueDate == null ? null : dueDate.toString());

                task.put("written", rs.getBoolean("written"));
                task.put("uploaded", rs.getBoolean("uploaded"));

                tasks.add(task);
            }

            response.getWriter().write(gson.toJson(tasks));

        } catch (SQLException e) {

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\":\"Unable to fetch tasks\"}"
            );

            e.printStackTrace();
        }
    }

    // CREATE: Add a new task
    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            JsonObject data = JsonParser.parseReader(
                request.getReader()
            ).getAsJsonObject();

            String title = data.has("title")
                    && !data.get("title").isJsonNull()
                    ? data.get("title").getAsString() : "";

            String subject = data.has("subject")
                    && !data.get("subject").isJsonNull()
                    ? data.get("subject").getAsString() : "General";

            String type = data.has("type")
                    && !data.get("type").isJsonNull()
                    ? data.get("type").getAsString() : "Assignment";

            String deadline = data.has("deadline")
                    && !data.get("deadline").isJsonNull()
                    ? data.get("deadline").getAsString() : "";

            if (title.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write(
                    "{\"error\":\"Task title is required\"}"
                );
                return;
            }

            String sql = "INSERT INTO task "
                    + "(title, description, due_date, status, "
                    + "subject, `type`, written, uploaded) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(sql)) {

                ps.setString(1, title);
                ps.setString(2, "");

                if (deadline.isEmpty()) {
                    ps.setNull(3, Types.DATE);
                } else {
                    ps.setDate(3, java.sql.Date.valueOf(deadline));
                }

                ps.setBoolean(4, false);
                ps.setString(5, subject);
                ps.setString(6, type);
                ps.setBoolean(7, false);
                ps.setBoolean(8, false);

                ps.executeUpdate();

                response.setStatus(HttpServletResponse.SC_CREATED);
                response.getWriter().write(
                    "{\"message\":\"Task added successfully\"}"
                );
            }

        } catch (Exception e) {

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\":\"Unable to add task\"}"
            );

            e.printStackTrace();
        }
    }

    // UPDATE: Change written or uploaded status
    @Override
    protected void doPut(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            JsonObject data = JsonParser.parseReader(
                request.getReader()
            ).getAsJsonObject();

            int id = data.get("id").getAsInt();
            String field = data.get("field").getAsString();
            boolean value = data.get("value").getAsBoolean();

            // Only allow these two columns to be updated
            if (!field.equals("written") && !field.equals("uploaded")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write(
                    "{\"error\":\"Invalid field\"}"
                );
                return;
            }

            String sql = "UPDATE task SET `" + field + "` = ? WHERE id = ?";

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(sql)) {

                ps.setBoolean(1, value);
                ps.setInt(2, id);

                int rows = ps.executeUpdate();

                if (rows > 0) {
                    response.getWriter().write(
                        "{\"message\":\"Task updated successfully\"}"
                    );
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write(
                        "{\"error\":\"Task not found\"}"
                    );
                }
            }

        } catch (Exception e) {

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\":\"Unable to update task\"}"
            );

            e.printStackTrace();
        }
    }

    // DELETE: Remove a task
    @Override
    protected void doDelete(HttpServletRequest request,
                            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            int id = Integer.parseInt(request.getParameter("id"));

            String sql = "DELETE FROM task WHERE id = ?";

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(sql)) {

                ps.setInt(1, id);

                int rows = ps.executeUpdate();

                if (rows > 0) {
                    response.getWriter().write(
                        "{\"message\":\"Task deleted successfully\"}"
                    );
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write(
                        "{\"error\":\"Task not found\"}"
                    );
                }
            }

        } catch (Exception e) {

            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                "{\"error\":\"Unable to delete task\"}"
            );

            e.printStackTrace();
        }
    }
}


