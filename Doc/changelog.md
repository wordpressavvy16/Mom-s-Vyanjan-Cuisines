# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.9] - 2024-08-21

### Added
- **Centralized API Service**: Created a new `services/apiService.ts` to act as the single, asynchronous data access layer for the entire application. All data-fetching functions now simulate network requests, preparing the application for a real backend.

### Changed
- **Major Architectural Refactor**: Refactored all components and contexts (`AuthContext`, `DashboardPage`, `CartPage`, etc.) to be fully asynchronous. All data operations now go through the new `apiService.ts`, completely decoupling the UI from the mock data source (`configService.ts`).

### Removed
- **Redundant Data Service**: Deleted `services/mockDataService.ts` as its role has been superseded by the more robust and scalable `apiService.ts`.

## [1.4.8] - 2024-08-20

### Changed
- **Architectural Refactoring for Scalability**: Refactored the data access layer as the first step towards a full-stack implementation. All `localStorage` persistence logic was consolidated into `configService.ts`, making it the single source of truth for mock data. `mockDataService.ts` was updated to act as a clean "API client" layer that only communicates with the `configService`, preparing the application for a seamless transition to a real backend.

## [1.4.7] - 2024-08-19

### Added
- **Project Documentation**: Created comprehensive project documentation files to aid future development and AI agent understanding.
  - `Doc/PRD.md`: A detailed Product Requirements Document outlining the application's current features, architecture, and user personas.
  - `Doc/PRD_GAP.md`: A supplementary gap analysis document suggesting potential improvements and future development paths.
- **Documentation Structure**: Organized all key project documents, including the changelog, under a new `Doc/` directory for centralized access.

## [1.4.6] - 2024-08-18

### Added
- **UI/UX Variation Generator Rules**: Added two new rule files (`tiffin_ui_variations.mdc` and `tiffin_ui_variations_pro.mdc`) to define a systematic approach for generating multiple design "skins" for the application based on detailed user personas.
- **Generated Design Variations**: Created five distinct, self-contained HTML design variations (`Tiffin_Variation_1.html` through `Tiffin_Variation_5.html`) based on the new rule files. These files serve as static examples of the generator's output.
- **Documentation Structure**: Organized all new rule files and generated variations under a new `Doc/` directory to separate them from the core application source code.

## [1.4.5] - 2024-08-17

### Added
- **Custom Social Media Platforms**: Enhanced the "Add Homepage Feed Item" modal in the Admin Dashboard's "Site Content" tab. The platform dropdown now includes an "Other..." option, which reveals a text input for administrators to add content from any custom social media source, providing greater flexibility.

## [1.4.4] - 2024-08-16

### Fixed
- **WhatsApp Conversations UI**: Corrected the layout of the chat bubbles in the WhatsApp AI Conversations tab. Messages from the agent now correctly appear on the right, and customer messages on the left, improving the intuitiveness of the chat interface.
- **Mobile Responsiveness for Chat**: Enhanced the mobile responsiveness of the three-column conversation view (Contacts, Chat, Details). The layout now stacks vertically on smaller screens, ensuring all content is accessible and readable without horizontal overflow.

## [1.4.3] - 2024-08-15

### Fixed
- **Dashboard Layout**: Resolved a critical responsive layout issue in the Admin Dashboard where wide content cards (e.g., tables in CRM, Orders) would overflow their container and break the page layout. The main content area now correctly contains its children, adding horizontal scrollbars to individual cards if necessary, ensuring the header, footer, and sidebar remain stable on all screen sizes.

## [1.4.2] - 2024-08-14

### Fixed
- **Dashboard Sidebar Scrolling**: Fixed a bug where the sidebar navigation menu in the Admin Dashboard was not scrollable on smaller screens, preventing access to menu items below the "Procurement" tab. The sidebar now correctly handles overflowing content, making all navigation links accessible.

## [1.4.1] - 2024-08-13

### Fixed
- **Changelog Accuracy**: Corrected the `v1.4.0` entry to accurately reflect that the media upload feature was implemented for the Homepage Social Feed, but not yet for Testimonials.

## [1.4.0] - 2024-08-12

### Added
- **Flexible Media Management**: Implemented a major usability enhancement across the platform by adding the option to upload media files (images, videos, etc.) directly from a device. This is available alongside the existing URL input method in all relevant sections, including:
  - **Admin Dashboard**:
    - Meal Management (Add/Edit Meal)
    - Social Media Scheduling
    - Site Content (Homepage Social Feed)
    - General Settings (Business Logo)
    - WhatsApp AI (Templates with Media)
  - **Partner Dashboard**:
    - Meal Management (Add/Edit Meal)
- **Instant Media Previews**: Added image/video previews in all forms and modals where media can be added. This allows users to verify their selection (whether uploaded or from a URL) before saving.
- **UI Toggles for Input Method**: Introduced intuitive toggles that allow users to seamlessly switch between providing a media URL and uploading a file.

## [1.3.2] - 2024-08-11

### Fixed
- **Dark Mode Form Visibility**: Corrected a UI bug where text inside form fields (inputs, textareas, selects) was invisible in dark mode due to missing color styles. This fix has been applied site-wide, notably on the Admin Dashboard and User Profile page, to ensure readability and a consistent user experience across all themes.

## [1.3.1] - 2024-08-10

### Fixed
- **Dashboard Compilation Error**: Resolved a critical compilation error in `DashboardPage.tsx` caused by a reference to an unexported constant from `configService.ts`. This fix simplifies the logic in the WhatsApp Automation modal and ensures the dashboard renders correctly.

## [1.3.0] - 2024-08-09

### Added
- **New Responsive Sidebar Navigation**: Implemented a modern, collapsible sidebar for the Admin Dashboard, replacing the horizontal tabs for improved navigation and a cleaner UI.
- **New Analytics Dashboard**: Introduced a comprehensive "Analytics" tab as the default view for admins, featuring KPI cards (Total Revenue, Avg. Order Value), a sales overview chart, and a list of top-selling meals.
- **New General Settings Tab**: Added a "General Settings" page, allowing administrators to easily manage core business information (name, logo, contact details) and site-wide currency settings.
- **Enhanced UI with Icons**: Added distinct icons for all navigation items in the new sidebar, improving visual recognition and overall user experience.

### Changed
- **Major Admin Dashboard UI/UX Overhaul**: Fundamentally redesigned the Admin Dashboard to be more intuitive and user-friendly, following modern UX principles.
- **Logical Feature Grouping**: Reorganized all administrative functions into workflow-based categories: **Analytics**, **Operations** (Orders, Menu, Inventory), **Growth** (CRM, Partners, Loyalty), and **Platform** (WhatsApp AI, Integrations, Site Content, Settings).

## [1.2.5] - 2024-08-08

### Fixed
- **Critical File Corruption**: Restored the `DashboardPage.tsx` file, which was truncated and causing a critical syntax error, preventing the Admin/Manager Dashboard from loading.

## [1.2.4] - 2024-08-07

### Added
- **Image Preview in Social Post Modal**: Implemented an image preview feature in the "Schedule Social Post" modal within the Admin Dashboard. When an admin enters an image URL, a preview is now displayed directly in the modal, improving usability and reducing errors. An error-state placeholder is shown for invalid URLs.

## [1.2.3] - 2024-08-06

### Fixed
- Resolved type errors in the WhatsApp AI automation section of the Admin Dashboard by correctly handling all `WhatsAppAction` types during rendering and in state management. The UI for creating and managing automations has been updated to be consistent with the latest data model.

### Added
- Implemented full functionality for the WhatsApp AI features as per changelog v1.2.0-v1.2.2, including the interactive chat simulator, analytics dashboard, and enhanced template/automation capabilities, which were previously not reflected in the UI.

### Changed
- **Social Media Planner**: Enhanced the "Schedule Social Post" modal in the Admin Dashboard. The platform dropdown now includes more options (LinkedIn, Pinterest, TikTok, YouTube) and a dynamic "Other" option with a text input, making the social media planner more flexible and future-proof.

## [1.2.2] - 2024-08-05

### Added
- **Interactive Chat Simulation**: Implemented full interactivity for the "Conversations (Mock)" tab in the WhatsApp AI section. Users can now click on a conversation to enter a detailed chat view, see a mock message history, and send replies using a new input form, which dynamically updates the chat.

## [1.2.1] - 2024-08-04

### Fixed
- Corrected a bug in the Admin Dashboard's WhatsApp Automations table where new action types (`Add to Audience List`, `Set Custom Attribute`) were not being rendered correctly, causing a display error.

## [1.2.0] - 2024-08-04

### Added
- **WhatsApp Analytics Dashboard**: Introduced a new "Analytics" tab as the primary view for the WhatsApp AI module, featuring key metric cards, message trend charts, and performance tables for campaigns and templates.
- **Interactive Message Templates**: Users can now add "URL" and "Quick Reply" buttons to WhatsApp templates via an enhanced creation modal to improve user engagement.
- **Advanced Automation Actions**: Expanded WhatsApp Automation capabilities with new actions, including "Add to Audience List" and "Set Custom Attribute," for more sophisticated user segmentation and personalization.
- **Mock Conversations View**: Added a new "Conversations" tab with a mock UI to simulate a live agent chat inbox, showcasing potential for real-time customer interaction.

### Changed
- **WhatsApp AI UI Overhaul**: The "WhatsApp AI" management section in the Admin Dashboard has been completely reorganized with a new, intuitive sub-navigation structure: "Analytics", "Conversations", "Campaigns", "Automations", and "Templates". This replaces the previous single-section layout for a much-improved user experience.
- **Enhanced Modals**: The modals for creating WhatsApp Templates and Automations have been updated to support their new respective features (interactive buttons and advanced actions).

## [1.1.0] - 2024-08-03

### Added
- **WhatsApp AI Navigation**: Implemented a new sub-navigation system within the "WhatsApp AI" tab in the Admin Dashboard, creating separate, organized sections for "Templates," "Campaigns," and "Automations" for a cleaner user experience.
- **New Automation Triggers**: Added more granular and marketing-focused automation triggers, including "Order Delivered," "Weekend special/promo offer," and "Festive and Holiday special offer."
- **New Default Templates**: Added new default message templates for order delivery notifications and festive offers to support the new automation triggers.

### Changed
- **Enhanced Automation UI**: The automation creation form now includes the newly added trigger options, providing more powerful and flexible workflow capabilities.
- **Improved Automation Logic**: Updated the default "Post-Delivery Feedback" automation to use the more specific "Order Delivered" trigger.

## [1.0.2] - 2024-08-02

### Changed
- **Email Provider Integration**: Enhanced the "Connect Email Provider" modal in the Admin Dashboard with more service options (Mailgun, Brevo, Amazon SES) and a future-proof "Other" option for custom provider names.

## [1.0.1] - 2024-08-01

### Changed
- **Social Media Integration**: Implemented the expansion of social media platform options in the Admin Dashboard's "Connect Social Account" modal. This includes adding presets for YouTube, TikTok, Pinterest, and WhatsApp, as well as a dynamic "Other" option for future-proofing, fulfilling the previous request.

## [1.0.0] - 2024-07-31

This marks the initial comprehensive version of the MoM's Vyanjan Tiffin Service web application, featuring a full suite of functionalities for users, administrators, and partners.

### Added

#### Core Architecture & Application Structure
- **React Application**: Initialized a modern React 19 application with `index.tsx` as the entry point.
- **Component-Based Structure**: Organized UI into reusable components (`Navbar`, `Footer`, `MealCard`, `LoadingSpinner`, etc.).
- **Page-Based Routing**: Implemented client-side routing using `react-router-dom` (`HomePage`, `MenuPage`, `CartPage`, etc.).
- **Context API for State Management**:
  - `AuthProvider`: Manages user authentication, session state, and user data.
  - `CartProvider`: Manages shopping cart state across the application.
  - `ThemeProvider`: Handles dynamic light/dark mode theming.
  - `SiteSettingsProvider`: Manages global site settings like currency and business information.
- **Offline-First Mock Backend**:
  - `mockDataService.ts` & `configService.ts`: A robust mock service layer using `localStorage` for data persistence, enabling full offline functionality for demonstration.
- **Comprehensive Type Definitions**: Established a `types.ts` file for strong typing across the application.
- **SEO & Metadata**: Included rich `meta` tags, `robots.txt`, and Schema.org `JSON-LD` scripts for enhanced search engine visibility.
- **Gemini AI Service**: Integrated `geminiService.ts` to connect to the Google Gemini API for various AI-powered features.
- `changelog.md` to track project development history.

#### User-Facing Features
- **Authentication**: Secure Login/Signup modal with guest user access and role-based redirects.
- **Homepage**: A dynamic homepage featuring a hero section with a typing effect, "Why Us?" benefits, a step-by-step ordering guide, and a daily menu section.
- **Meal Browsing**:
  - `MenuPage`: A full menu page with real-time search and filtering by dietary preference and category.
  - `MealDetailPage`: A detailed view for each meal, including description, ingredients, calories, customer reviews, and customization options.
- **Shopping Cart & Checkout**:
  - Fully functional cart with capabilities to add, remove, and update item quantities.
  - `CartPage`: A comprehensive summary of the cart, promo code application, and dynamic delivery slot selection.
  - A mock checkout process that leads to order creation.
- **User Profile**:
  - `ProfilePage`: A multi-tabbed user dashboard to view order history, manage profile information (name, bio, dietary preferences), and update addresses.
  - Feature to submit star ratings and text reviews for delivered meal items.
- **Order Tracking**: Real-time order tracking page (`OrderTrackingPage`) with a simulated Google Maps view (`OrderTrackingMap`) showing the delivery person's location.
- **AI-Powered Assistance**:
  - `GeminiChatPopup`: An AI chat assistant on the meal detail page to answer specific questions about a meal.
  - `SupportChatbot`: A site-wide support chatbot for general inquiries.
- **Customer Loyalty & Referrals**:
  - A points-based loyalty program with tiers and rewards.
  - A complete user referral system where both the referrer and the new user receive rewards.
- **Partner Application**: A `BecomePartnerPage` with a form for prospective partners to submit their applications.

#### Admin, Manager, and Partner Features
- **Role-Based Dashboards**:
  - `DashboardPage`: A central hub for Admins and Managers with different levels of access.
  - `PartnerDashboardPage`: A dedicated dashboard for partners to manage their own meals and view agreements.
- **Order Management (Admin/Manager)**: View all customer orders, filter them, and update their status (e.g., from 'Processing' to 'Out for Delivery').
- **Meal & Menu Management**:
  - **CRUD Operations**: Admins, Managers, and Partners can create, read, update, and delete meals.
  - **Daily Menu Planner**: Admins/Managers can schedule which meals are available for specific meal slots on any given day.
- **Inventory & Procurement Management**:
  - `Inventory`: A system to track stock levels of ingredients with low-stock warnings.
  - `Procurement`: A tool to create a purchase list, which can be converted into a purchase order that automatically updates inventory upon completion.
- **CRM (Admin)**: A user management tab to view details of all registered users, including their orders and reviews.
- **Partner Management (Admin)**:
  - Review and approve/reject partner applications.
  - Manually create new partner accounts.
- **Site & System Configuration (Admin)**:
  - Configure delivery slot timings and order cutoff times.
  - Manage the Customer Loyalty Program settings, including points, tiers, and referral rewards.
- **Site Content Management (Admin)**:
  - Add, view, and delete customer testimonials that appear on the homepage.
  - Manage the items and links displayed in the homepage's social media feed mockup.
- **Integrations & Automations (Admin)**:
  - A dedicated section for managing third-party connections and automation rules.
  - Mock social media post scheduling and email workflow creation.
  - Configure mock automation rules for support tickets.
- **WhatsApp Agentic AI Management (Admin)**:
  - A full suite to manage mock WhatsApp communications.
  - Create and manage message templates, with AI-powered content generation.
  - Create, schedule, and view mock statistics for broadcast campaigns.
  - Set up mock workflow automations based on user triggers (e.g., send a welcome message on signup).