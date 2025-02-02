APIS

Route: POST - localhost:5000/api/login
body payload:
{
  "email": "b@gmail.com",
  "password": "123456"
}



Route: POST - localhost:5000/api/signup
body payload:
{
  "name": "C",
  "email": "b@gmail.com",
  "password": "123456"
}


Route: GET - localhost:5000/api/users 
OR 
Route: GET - localhost:5000/api/users?page=1&limit=1
Headers: Authorization: `Bearer ${token}`
Query params : 
{
    page: 1,
    limit: 1
}


Route: GET - localhost:5000/api/me
Headers: Authorization: `Bearer ${token}`



Use Case:
1. Signup 
- Missing fields like dont send email or password or name 
- Try same email twice

2. Login 
- Missing fields like don't send email or password
- Send Wrong password

3. User Listing
- With or without limit and page query parameters / Wrong Token value

4. Logged in user details (/me) API
- Without Sending Authoriation key-value in Headers / Wrong Token value / Without  prepending "Bearer  " /  Without adding space after Beaerer

