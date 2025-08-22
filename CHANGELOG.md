# Changelog

All notable changes to the Team Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-22

### Added
- **Historical Capacity Data Extraction**: New feature to export historical team capacity data from the Dashboard
- **Excel Export with Custom Date Ranges**: Users can select any date range for historical analysis
- **Multi-Sheet Excel Reports**: Professional Excel workbooks with summary and detailed allocation sheets
- **Role-Based Export Access**: Historical exports restricted to Admin and Manager roles only
- **Flexible Export Options**: Optional inclusion/exclusion of weekly priorities and notes
- **Enhanced Dashboard UI**: New "Export Historical" button alongside existing export functionality

### Enhanced
- **Backend API**: New endpoints `/api/capacity/extract-historical` and `/api/capacity/export-excel`
- **ExcelJS Integration**: Professional spreadsheet generation with proper formatting and styling
- **Data Processing**: Improved historical data aggregation and calculation methods
- **User Experience**: Clear modal dialogs with export progress indicators and helpful descriptions

### Technical
- **New Dependencies**: Added ExcelJS for Excel file generation
- **API Expansion**: Extended capacity controller with historical data processing
- **Frontend State Management**: Enhanced Dashboard component with export functionality
- **Error Handling**: Improved error messages and user feedback for export operations

### Security
- **Access Control**: Historical exports require Admin or Manager privileges
- **Data Validation**: Input validation for date ranges and export parameters

## [1.0.0] - 2025-01-21

### Added
- **Initial Release**: Team Management System with capacity planning and allocation features
- **User Management**: Admin, Manager, Developer, Tester, QA Manager, and View-Only roles
- **Capacity Planning**: Weekly allocation tracking across multiple development categories
- **Time Off Management**: Request, approval, and calendar integration system
- **Dashboard Analytics**: Team capacity visualization with charts and metrics
- **JIRA Integration**: Automatic ticket tracking and sprint information display
- **Docker Support**: Full containerization with PostgreSQL database
- **Authentication**: JWT-based secure authentication system
- **Real-time Updates**: Live capacity calculations with holiday adjustments

### Categories Supported
- Backend Development
- Frontend Development  
- Code Review
- Release Management
- UX Design
- Technical Analysis
- Production Support

### Features
- **Weekly Priority Tracking**: TODO assignments and capacity allocation
- **Holiday Management**: Automatic capacity adjustments for time off
- **Export Functionality**: Excel export of current dashboard data
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Data Persistence**: PostgreSQL database with Prisma ORM
- **Development Tools**: Hot reload, TypeScript support, comprehensive tooling