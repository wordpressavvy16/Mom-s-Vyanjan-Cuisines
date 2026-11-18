# Product Requirements Document: MoM's Vyanjan Tiffin Service

**Version:** 1.4.8
**Date:** 2024-08-20
**Status:** In Development

---

## 1. Introduction & Vision

**MoM's Vyanjan Tiffin Service** is a comprehensive web application designed to bring the comfort and taste of authentic, home-style Indian meals to customers through a modern, user-friendly digital platform.

The project's vision is to be the premier online destination for ordering daily tiffin meals, combining the warmth of a family-run kitchen with the efficiency and feature-richness of a modern tech company. We solve the problem of finding healthy, reliable, and delicious daily meal options for busy individuals, families, and professionals.

The platform serves a multi-sided market, catering not only to end-consumers but also to administrative staff (Admins, Managers) and a network of third-party meal providers (Partners).

## 2. Target Audience & User Personas

The application is designed for several distinct user groups, each with specific roles and permissions:

*   **User:** The primary consumer. They can browse the menu, customize meals, place orders, track deliveries, manage their profile, and interact with support.
*   **Guest:** An unauthenticated visitor who can browse the menu and add items to the cart but must sign up or log in to complete an order.
*   **Partner:** A third-party tiffin service provider who uses a dedicated dashboard to manage their own meal listings, track their sales (future scope), and manage their business relationship with MoM's Vyanjan.
*   **Manager:** An employee with operational oversight. They can manage menus, orders, inventory, and daily operations but have restricted access to platform-wide settings.
*   **Admin:** A superuser with full control over the platform, including user management, partner approvals, system configurations, and all manager-level functionalities.

Furthermore, a design variation system has been developed to cater to specific sub-personas of the "User" role, demonstrating the platform's adaptability:
1.  **The Busy Tech Professional (Theme: Techie Fuel):** Prioritizes efficiency, clarity, and a high-performance, dark-mode native UI.
2.  **The Health-Conscious Fitness Enthusiast (Theme: FitBites):** Values an inspiring, clean, and organic UI that motivates healthy choices.
3.  **The Traditional Home-Seeker (Theme: Ghar Ka Khana):** Needs a simple, trustworthy UI with high-contrast, large fonts, and minimal complexity.
4.  **The University Student (Theme: Campus Cravings):** Responds to a trendy, expressive, and fun UI with bold colors and playful interactions.
5.  **The Corporate Executive (Theme: Power Lunch):** Expects a premium, sophisticated, and professional UI that conveys exclusivity and quality.

## 3. Key Features & Functionality

### 3.1. Customer-Facing Platform

| Feature                 | Description                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**      | Secure login/signup modal. Supports guest browsing. Integrated user referral system (`?ref=CODE`) to apply rewards on signup.                                                                             |
| **Homepage**            | Dynamic landing page with a hero section, "Why Us" value propositions, step-by-step ordering guide, and a curated "Today's Menu" section that updates based on the current meal slot (Breakfast, Lunch, Dinner). |
| **Menu & Meal Details** | A fully filterable and searchable menu page. Detailed meal pages include images, descriptions, ingredients, dietary tags, calorie info, customization options (spice level, portion size), and customer reviews. |
| **Shopping Cart**       | Persistent cart to add, update quantity, or remove items. Supports promo code application and dynamic delivery slot selection for today and tomorrow, respecting order cutoff times.                             |
| **User Profile**        | A multi-tabbed dashboard for authenticated users to: <ul><li>View order history and review past items.</li><li>Manage personal information, dietary preferences, and saved addresses.</li><li>Track loyalty points, view rewards tiers, and see active coupons.</li></ul> |
| **Live Order Tracking** | A real-time order tracking page featuring an interactive Google Map that simulates the delivery person's journey from the kitchen to the user's destination.                                               |
| **AI-Powered Support**  | <ul><li>**Meal Assistant:** A Gemini-powered chat popup on each meal detail page to answer specific questions about that dish.</li><li>**General Support Chatbot:** A site-wide FAB chatbot for general inquiries about the service.</li></ul> |
| **Partner Program**     | A "Become a Partner" page with an application form for other tiffin services to join the platform's network.                                                                                                |
| **Static & Legal Pages**| Includes About Us, Blog, FAQ, Privacy Policy, Terms of Service, Refund Policy, and Accessibility Statement pages for full transparency.                                                                    |

### 3.2. Administrative & Partner Dashboards

| Feature                       | Description                                                                                                                                                                                                                                                          | Roles             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Role-Based Access Control** | The application serves a distinct dashboard UI for Admins/Managers (`/dashboard`) and Partners (`/partner-dashboard`) with features tailored to their roles.                                                                                                               | All               |
| **Analytics Dashboard**       | The default view for admins, showing key KPIs (Total Revenue, Avg. Order Value), a sales trend chart, and a list of top-selling meals.                                                                                                                                    | Admin, Manager    |
| **Order Management**          | Centralized view of all customer orders. Staff can update order statuses (e.g., Confirmed -> Out for Delivery), which reflects on the customer's tracking page.                                                                                                          | Admin, Manager    |
| **Menu & Inventory Mgmt.**    | <ul><li>**Meal CRUD:** Full create, read, update, delete functionality for meals.</li><li>**Daily Planner:** A scheduler to set the menu for specific dates and meal slots.</li><li>**Inventory:** Track stock levels of ingredients, with low-stock warnings.</li></ul> | Admin, Manager    |
| **Partner Meal Management**   | Partners have a dedicated dashboard to perform CRUD operations **only on their own meals**.                                                                                                                                                                            | Partner           |
| **Procurement System**        | A workflow to manage purchasing. Low-stock items can be added to a "Purchase List". This list can be finalized into a "Purchase Order," which automatically updates inventory levels.                                                                                    | Admin, Manager    |
| **CRM & User Management**     | A complete list of all users. Admins can view detailed user profiles, including their full order/review history. Features an **AI Analysis** tool to generate CRM insights (churn risk, upsell opportunities) for a selected user.                                  | Admin             |
| **Partner Management**        | Admins can review, approve, or reject partner applications. Approving an application automatically creates a new `Partner` user account.                                                                                                                                | Admin             |
| **WhatsApp Agentic AI Suite** | A comprehensive mock-up of a WhatsApp business solution: <ul><li>**Templates:** Create/manage message templates with AI content generation.</li><li>**Campaigns:** Schedule and monitor mock broadcast campaigns.</li><li>**Automations:** Build workflows (e.g., "Send welcome message on signup").</li><li>**Conversations:** An interactive chat inbox simulator for managing customer conversations.</li></ul> | Admin             |
| **Platform Configuration**    | Admins have full control over site settings: <ul><li>**General Settings:** Business name, logo, contact info, currency.</li><li>**Delivery Slots:** Configure delivery hours, windows, and cutoff times.</li><li>**Loyalty Program:** Set points per dollar, tier thresholds, and referral rewards.</li><li>**Site Content:** Manage testimonials and social feed items displayed on the homepage.</li></ul> | Admin             |

## 4. Technical Stack & Architecture

*   **Frontend Framework:** React 19 with TypeScript
*   **Styling:** Tailwind CSS with a custom, extendable theme configuration.
*   **State Management:** React Context API for modular and decoupled state management.
*   **Routing:** `react-router-dom` for client-side routing.
*   **Backend & Database:** Mocked via browser `localStorage`. A centralized `configService.ts` acts as a single source of truth for data persistence, mimicking a database. A new, centralized `apiService.ts` now handles all data access for the entire application. This service uses asynchronous functions, simulating real network requests and fully decoupling the UI from the data layer. This architecture is highly scalable and prepared for a seamless transition to a real backend.
*   **AI Integration:** `@google/genai` SDK for connecting to the Google Gemini API.
*   **Mapping:** Google Maps JavaScript API for order tracking.
*   **SEO:** Rich metadata, `JSON-LD` for schema markup, `robots.txt`, and a sitemap link are included for search engine optimization.

## 5. Design, UI/UX, and Accessibility

*   **Design System:** A component-based design built on a custom Tailwind CSS theme. The theme defines a consistent color palette (Primary: Orange, Secondary: Green), typography (`Lexend`, `Outfit`), and a library of custom animations for a fluid user experience.
*   **Theming:** Supports both Light and Dark modes, with user preference persisted in `localStorage`.
*   **Responsiveness:** The application is fully responsive and designed to work seamlessly across desktop, tablet, and mobile devices.
*   **Accessibility (a11y):** The application demonstrates a commitment to accessibility through semantic HTML, ARIA attributes, and an on-screen accessibility toolbar for adjusting font size and contrast (mocked).
*   **UI Variation System:** A key deliverable is the design variation system, documented in the `/Doc` folder. This system uses rule-based generation (via `.mdc` files) to create multiple, distinct UI "skins" based on target personas, showcasing the platform's design flexibility. Five static HTML examples are provided.