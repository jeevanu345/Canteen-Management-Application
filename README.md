# Instant Canteen

## Project Overview

**Instant Canteen** is a modern web application designed to simplify payments and ordering prior at campus canteens and shops.Studnets can place orders from their phone during class hours and enjoy their orders while skipping long queues during peak rush hours like short break and lunch break, students use their mobile phones to scan a UPI QR code and pay instantly, eliminating the need for cash and providing a seamless transaction experience for both students and vendors.

The ablity of Staff (canteen owners) to receive orders before rush hours allows them to prepare these orders and increase the overall sales that happen during the break time while also reducing the waiting time for students this coupled futher with a Staff dashboard allows them to dynamically change menu items,track and process orders.

This project is built with a focus on a clean user interface, security, and performance.

## Visit now ~ https://instantcanteen.netlify.app
## Key Features

* **Quick Scan & Pay:** Instantly scan UPI QR codes to initiate payments.
* **Intuitive UI:** A user-friendly interface optimized for mobile devices.
* **Vendor Dashboard:** A separate dashboard for canteen owners to manage their details and update their UPI QR code.
* **Transaction History:** (Future Feature) View a history of all payments made.

## Technologies Used

* **Frontend:** React, TypeScript
* **Styling:** Tailwind CSS
* **Build Tool:** Vite
* **Database & Auth:** Supabase (for user authentication and data management)

## Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm

### Installation and Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/haris-collab/Instant_Canteen.git
    cd campus-pay-scan
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of your project and add your Supabase credentials:
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.

## Deployment

This project can be easily deployed to platforms like Vercel, Netlify, or AWS Amplify.

### Example: Vercel

1.  Push your code to a GitHub repository.
2.  Log in to Vercel and import your project from Git.
3.  Vercel will automatically detect the Vite setup and deploy the app.
4.  Add your Supabase environment variables in the Vercel dashboard under "Settings > Environment Variables."



