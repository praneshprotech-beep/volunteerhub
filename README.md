# VolunteerHub

VolunteerHub is a Spring Boot REST API for NGO events, volunteers, signups, and attendance.

## Requirements

- Java 27
- MySQL 8 or compatible

Create the database in MySQL if the configured account does not have permission to create it automatically:

```sql
CREATE DATABASE volunteerhub;
```

The default connection uses `root` with an empty password. Set these environment variables to match your local MySQL setup:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
```

`DB_URL` is also configurable; by default it connects to `localhost:3306/volunteerhub`. Hibernate creates or updates the tables on startup.

## Run and Test

From the project directory:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

The API listens at `http://localhost:8080`. In Postman, use `Content-Type: application/json` for POST and PUT requests.

## Endpoints

| Resource | Collection | Supported requests |
| --- | --- | --- |
| Events | `/api/events` | GET, POST; GET/PUT/DELETE `/{id}` |
| Volunteers | `/api/volunteers` | GET, POST; GET/PUT/DELETE `/{id}` |
| Signups | `/api/signups` | GET, POST; GET/PUT/DELETE `/{id}` |
| Attendance | `/api/attendance-records` | GET, POST; GET/PUT/DELETE `/{id}` |

POST returns `201 Created`, GET and PUT return `200 OK`, and DELETE returns `204 No Content`. Invalid input returns `400`, missing records return `404`, and business-rule or database conflicts return `409` with a JSON error body.

## Postman Examples

Create an event with `POST /api/events`:

```json
{
  "eventName": "Community Garden Day",
  "eventDate": "2026-10-10",
  "location": "Northside Community Garden",
  "volunteerCapacity": 20
}
```

Create a volunteer with `POST /api/volunteers`:

```json
{
  "name": "Jordan Lee",
  "email": "jordan@example.com",
  "phone": "555-0102"
}
```

Sign up using the IDs returned by those requests. `signupDate` is optional and defaults to today:

```json
{
  "volunteerId": 1,
  "eventId": 1,
  "status": "CONFIRMED"
}
```

Record attendance with `POST /api/attendance-records`:

```json
{
  "volunteerId": 1,
  "eventId": 1,
  "attended": true,
  "contributedHours": 4
}
```

An event at capacity rejects additional signups. Attendance marked `true` requires positive contributed hours; when attendance is `false`, contributed hours must be `0` or omitted.