# Helpdesk Backend

This is the backend repository for the Helpdesk web application.

## Quick Setup Instructions

Follow these steps to set up the project locally:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/adarsh-fxz/helpdesk-backend.git

   ```

2. **Navigate to the project directory**

   ```bash
   cd helpdesk-backend

   ```

3. **Install dependencies**

   ```bash
   npm install

   ```

4. **Set Up Environment Variables**

   - Create a `.env` file in the root directory of the project.
   - Add the following environment variables to the `.env` file:

     ```env
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/helpdesk
     JWT_SECRET=your_secret_key
     ```

5. **Run Locally**

   ```bash
   npm run dev
   ```

you can now access the API at `http://localhost:3000`.