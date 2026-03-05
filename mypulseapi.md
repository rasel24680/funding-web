API Documentation

Data APIs
Support
Log In
Get Access
Home
/
Data APIs
Data APIs
Introduction
The myPulse Data APIs provide seamless, real-time access to SME information, enabling better decisions through enriched company, director, and financial data

They support data validation, integration, and advanced search, helping users assess business structure, financial health, and stakeholder history with confidence.

Direct connections to accounting and banking platforms deliver up-to-date customer insights, while detailed datasets — including filed accounts, director history, and CCJs — support a range of applications.

Use cases include credit scoring, SME lending, identity verification, supplier due diligence, and vendor enrichment.

Solution APIs
API Description
Company Info Provides core information about a UK company, including registered name, company number, incorporation date, legal status, SIC codes, and registered address.
Company Officers Returns details of current and past directors, company secretaries, and persons with significant control (PSC), including appointment dates and status.
Associated Companies Identifies related companies through Directors, Shareholders, helping assess networks and cross-ownerships.
Mortgages Provides data on charges and mortgages registered against the company, including the charge amount, date, holder, and status (satisfied or outstanding).
Company Charges Returns full details of fixed and floating charges filed with Companies House, including assets secured and terms of the security.
Gazette Access to notices published in The Gazette, such as insolvency, winding-up petitions, company dissolution, signalling key events affecting a company’s legal status.
CCJ Returns records of County Court Judgements registered against the company, including judgment date, amount, and status (satisfied or unsatisfied).
Group Structure Provides a hierarchy of parent companies, subsidiaries, and related entities within a corporate group.
Bank Transaction Categorization Analyses company banking data and classifies transactions into categories such as income, utilities, and payroll, supporting cashflow and affordability insights.
Filed Accounts Returns publicly filed financial statements, such as full, micro-entity, and dormant accounts, including balance sheets, P&L summaries, and filing dates.
Management Accounts Provides periodic internal financials (monthly/quarterly), including income statements, balance sheets, and key ratios not available via Companies House.
Forecast Supplies projected financial figures based on historicals and trend model, such as revenue forecasts, cashflow predictions, and expense projections.
Debtors Analysis Breaks down the company's debtor book, including outstanding receivables by age, customer, and invoice, to evaluate credit risk and cashflow health.
Debtor Detailed Analysis Granular view of individual debtor accounts, including due dates, overdue amounts, terms, and customer-level credit trends.
Credit Notes Returns issued credit notes, their reference invoices, dates, values, and reasons — offering insight into returns, discounts, and revenue adjustments.
Invoices Provides visibility into issued and received invoices, including invoice dates, due dates, line-item details, payment status, and values.
Creditors Details the company’s trade and non-trade creditors, outstanding obligations, payment terms, and ageing buckets, useful for understanding liabilities and vendor relationships.
Purpose
The purpose of this document is to detail the API response layout returned from the myPulse SME database.

Fields are returned in one of four formats:
string

Integer

float

Date- Date with timestamp

API Response Codes
Code Description
200 Success
401 Your API request was not properly authorized.
404 One or more of the resources you referenced could not be found.
Request Header
Request Header
API image
API image
Request Body
Request Body
Company Data
Company Info
API returns key information about a business based on the Company Registration Number (CRN) provided as an input parameter.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-company-details/{Company-CRN}
Get Company Details
Company_CRN
String
Company Registration Number
Company_Name
String
Name of the company
Company_Type
String
Type of the company
Company_Status
String
Current status of the company
Incorporation_Date
Date
Date of incorporation
Date_Of_Cessation
Date
Date of cessation, if applicable
Dissolution_Status
String
Status of dissolution
Date_Dissolved
Date
Date the company was dissolved
Address_Line1
String
Trading address line 1
Address_Line2
String
Trading address line 2
City
String
City of the trading address
Country
String
Country of the trading address
Postal_Code
String
Postal code of the trading address
Registered_Address
String
Registered address of the company
Trading_Address
String
Full trading address
Sic_Code
String
SIC code (industry classification)
Sic_Code_Description
String
Description of SIC segment
Latest_Action
String
Latest action reported
Auditor
String
Assigned auditor
Company_Url
String
URL for the company
No_Of_Employees
String
Reported number of employees
Start_Date_Year
Date
Company start date
Next_Accounts_Period_Due_On
Date
Next accounts period due date
Next_Accounts_Period_End_On
Date
End date of the next accounts period
Next_Accounts_Period_Start_On
Date
Start date of the next accounts period
Accounts_Next_Made_Upto
Date
Date accounts are next made up to
Accounting_Reference_Date
Date
Accounting reference date
Last_Accounts_Period_Start_On
Date
Start date of last accounts period
Last_Accounts_Period_End_On
Date
End date of last accounts period
Last_Accounts_Type
String
Type of last filed accounts
Accounts_Next_Due
Date
Next accounts due date
Confirmation_Statement_Next_Due
Date
Next confirmation statement due date
Last_Filed_Accounts_Date
Date
Date of last filed accounts
Tax_Number
String
Company tax number
Common_Value
String
Common value field (purpose unspecified)
Provider_Value
Integer
Provider-specific value identifier
Ultimate_Parent_CRN
String
CRN of the ultimate parent company
Ultimate_Parent_Country
String
Country of the ultimate parent company
Contact_Number
String
Company contact number
Company Info Playground
Company Info API
Use the form to test the Company Info API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_ID": 13387951,
"Company_CRN": "09421861",
"Duns_No": null,
"Company_Name": "GOFUELS LTD",
"Incorporation_Date": "2015-02-04T00:00:00",
"Company_Status": "Active",
"Address_Line1": "427 CHORLEY NEW ROAD",
"Address_Line2": "HORWICH",
"City": "BOLTON",
"Country": "ENGLAND",
"Postal_Code": "BL6 6DT",
"Company_Type": "Private Limited Company",
"Dissolution_Status": null,
"Date_Dissolved": null,
"SIC_Code": null,
"SIC_Code_Description": "47300 - Retail sale of automotive fuel in specialised stores",
"Latest_Action": null,
"Auditor": null,
"Company_URL": null,
"No_Of_Employees": null,
"Start_Date_Year": null,
"Next_Accounts_Period_Due_On": null,
"Next_Accounts_Period_End_On": null,
"Next_Accounts_Period_Start_On": null,
"Accounts_Next_Made_Upto": null,
"Accounting_Reference_Date": "31/03",
"Last_Accounts_Period_Start_On": "2022-04-01",
"Last_Accounts_Period_End_On": "2023-03-31",
"Last_Accounts_Type": "TOTAL EXEMPTION FULL",
"Accounts_Next_Due": "2024-12-31T00:00:00",
"Confirmation_Statement_Next_Due": "2024-08-17T00:00:00",
"Last_Filed_Accounts_Date": "31/03",
"Tax_Number": null,
"Common_Value": "B",
"Provider_Value": "52",
"Ultimate_Parent_CRN": null,
"Ultimate_Parent_Country": null,
"Segment": null,
"Trading_Address": null,
"Contact_Number": null
}
}
]
Company Charges
This API brings back existing charges records for requested SME based on the Company Registration Number (CRN) and optionally filter by category

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-charges/{Company-CRN}
Charges Report
Company_CRN
String
Company Registration Number associated with the charge.
Charge_Date
Date
Date when the charge was created.
Person_Entitled
String
Person or entity entitled under the charge.
Description
String
Description of the charge.
Charge_Status
String
Current status of the charge.
Company Charges Playground
Company Charges API
Use the form to test the Company Charges API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "09421861",
"Company_Charges": [
{
"Charge_Date": "2015-03-24T00:00:00",
"Delivery_Date": null,
"Persons_Entitled": "HSBC BANK PLC",
"Description": "A FIXED AND FLOATING CHARGE OVER ALL ASSETSCONTAINS FIXED CHARGE.CONTAINS FLOATING CHARGE.FLOATING CHARGE COVERS ALL THE PROPERTY OR UNDERTAKING OF THE COMPANY.CONTAINS NEGATIVE PLEDGE.",
"Charges_Status": "Satisfied"
},
{
"Charge_Date": "2024-09-26T00:00:00",
"Delivery_Date": null,
"Persons_Entitled": "VALERO ENERGY LTD",
"Description": "THE LEASEHOLD LAND KNOWN AS LIME SERVICE STATION, MANCHESTER ROAD, WORSLEY, MANCHESTER, M28 3NS HELD UNDER A LEASE DATED 24 SEPTEMBER 2024 BETWEEN (1) THE MORTGAGOR (AS DEFINED IN THE DEBENTURE) AND (2) THE COMPANY.CONTAINS FIXED CHARGE.CONTAINS FLOATING CHARGE.FLOATING CHARGE COVERS ALL THE PROPERTY OR UNDERTAKING OF THE COMPANY.CONTAINS NEGATIVE PLEDGE.",
"Charges_Status": "Outstanding"
}
]
}
}
]
Group Structure
This API brings back group structure records for a company registration number provided as input.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-group-structure/{Company-CRN}
Group Structure Details
Company_Id
Integer
Unique identifier for the company record in the database.
Company_Name
String
Name of the company within the group structure.
Company_CRN
String
Company Registration Number identifying the business.
Incorporation_Date
Date
Date on which the company was incorporated.
Last_Updated
Date
Date when the group structure data was last updated.
Registration_Number
String
Registration number of the company (can be same as CRN).
Company_Status
String
Current legal status of the company.
Last_Filed_Accounts_Date
Date
Date when the most recent accounts were filed.
Structure_Type
String
Describes the company’s position in the group (e.g., parent, subsidiary).
Country
String
Country where the company is registered.
Group Structure Playground
Group Structure API
Use the form to test the Group Structure API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Data": [
{
"Company_CRN": "09539504",
"Company_Name": "LINCOLN PROPERTY COMPANY LIMITED",
"Group_Structure": [
{
"Company_CRN": "09666719",
"Company_name": "LINCOLN PROPERTY COMPANY 2 LIMITED",
"Incorporation_Date": "2015-07-02T00:00:00",
"Last_Filed_Accounts_Date": "31/07",
"Company_Status": "Dissolved",
"Structure_Type": "Subsidiary-Company",
"country": "England"
},
{
"Company_CRN": "10180907",
"Company_name": "FRESHRENT LTD",
"Incorporation_Date": "2016-05-16T00:00:00",
"Last_Filed_Accounts_Date": "31/05",
"Company_Status": "Dissolved",
"Structure_Type": "Affiliated-Company",
"country": "England"
},
{
"Company_CRN": "10262759",
"Company_name": "STUDENT SMART LIMITED",
"Incorporation_Date": "2016-07-05T00:00:00",
"Last_Filed_Accounts_Date": "31/07",
"Company_Status": "Dissolved",
"Structure_Type": "Subsidiary-Company",
"country": "England"
},
{
"Company_CRN": "11424325",
"Company_name": "MHC CONSTRUCTION LINCOLN LTD",
"Incorporation_Date": "2018-06-20T00:00:00",
"Last_Filed_Accounts_Date": "31/07",
"Company_Status": "Active",
"Structure_Type": "Affiliated-Company",
"country": "ENGLAND"
},
{
"Company_CRN": "11727247",
"Company_name": "ASKAM CONTI HOLDINGS LIMITED",
"Incorporation_Date": "2018-12-14T00:00:00",
"Last_Filed_Accounts_Date": "31/07",
"Company_Status": "Active",
"Structure_Type": "Immediate-Parent",
"country": "ENGLAND"
}
]
}
],
"Pagination": [
{
"Offset": 0,
"Limit": 5,
"TotalRecords": 8,
"TotalPages": 2,
"CurrentPage": 1,
"NextPage": 2,
"PrevPage": null
}
]
}
}
]
Mortgages
This API brings back mortgages records for requested SME based on the Company Registration Number (CRN).

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-mortgages/{Company-CRN}
Mortgage Report
Company_CRN
String
Company Registration Number associated with the mortgage.
Mortgage_Id
Integer
Unique identifier for the mortgage record.
Mortgage_No
String
Official mortgage number assigned to the record.
Date_Created
Date
Date on which the mortgage was created.
Type
String
Type of mortgage, e.g., Debentures, General Charges.
Holder
String
Name of the mortgage holder.
Secured_On
String
Asset or entity on which the mortgage is secured.
Details
String
Additional details or description of the mortgage.
Satisfied
String
Status indicating whether the mortgage has been satisfied.
Satisfied_Date
Date
Date on which the mortgage was satisfied.
Form_No
String
Form identifier related to the mortgage filing.
Mortgages Playground
Mortgages API
Use the form to test the Mortgages API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "09421861",
"Mortgages": [
{
"Mortgage_ID": 2930608140,
"Mortgage_No": 2,
"Form_No": "MR01",
"Type": "GENERAL CHARGE",
"Holder": "VALERO ENERGY LTD",
"Secured_On": "THE LEASEHOLD LAND KNOWN AS LIME SERVICE STATION, MANCHESTER ROAD, WORSLEY, MANCHESTER, M28 3NS HELD UNDER A LEASE DATED 24 SEPTEMBER 2024 BETWEEN (1) THE MORTGAGOR (AS DEFINED IN THE DEBENTURE) AND (2) THE COMPANY.CONTAINS FIXED CHARGE.CONTAINS FLOATING CHARGE.FLOATING CHARGE COVERS ALL THE PROPERTY OR UNDERTAKING OF THE COMPANY.CONTAINS NEGATIVE PLEDGE.",
"Details": "",
"Satisfied": "No",
"Satisfied_Date": "0",
"Date_Created": "2024-09-26T00:00:00"
},
{
"Mortgage_ID": 1552432671,
"Mortgage_No": 1,
"Form_No": "MR04",
"Type": "GENERAL CHARGE",
"Holder": "HSBC BANK PLC",
"Secured_On": "A FIXED AND FLOATING CHARGE OVER ALL ASSETSCONTAINS FIXED CHARGE.CONTAINS FLOATING CHARGE.FLOATING CHARGE COVERS ALL THE PROPERTY OR UNDERTAKING OF THE COMPANY.CONTAINS NEGATIVE PLEDGE.",
"Details": "",
"Satisfied": "Fully",
"Satisfied_Date": "2024-04-13",
"Date_Created": "2015-03-24T00:00:00"
}
]
}
}
]
Company CCJs
This API brings back existing country court judgment records for requested SME based on the Company Registration Number (CRN) and optionally filter by category.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-ccj/{Company-CRN}
CCJ Report
Company_CRN
String
Company Registration Number associated with the CCJ.
CCJ_ID
Integer
Unique identifier for the CCJ record.
Court
String
Court that issued the CCJ.
Date_Raised
Date
Date when the CCJ was raised.
Amount
Integer
Amount of the CCJ.
CCJ_Status
String
Current status of the CCJ.
Date_Satisfied
Date
Date when the CCJ was satisfied, if applicable.
Company CCJ Playground
Company CCJ API
Use the form to test the Company CCJ API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "09421861",
"CCJ_Details": [
{
"CCJ_ID": 13387951,
"Case_Number": "F3DT5W68",
"Court": "COUNTY COURT BUSINESS CENTRE",
"Name": null,
"Address": "427 Chorley New Rd,Horwich,Bolton,Lancashire,BL6 6DT",
"Date_Raised": "2019-07-25T00:00:00",
"Amount": 1672,
"CCJ_Status": "Satisfied",
"Date_Satisfied": "2019-09-26"
},
{
"CCJ_ID": 13387951,
"Case_Number": "F8DT7Z41",
"Court": "COUNTY COURT BUSINESS CENTRE",
"Name": null,
"Address": "427 Chorley New Rd,Horwich,Bolton,Lancashire,BL6 6DT",
"Date_Raised": "2019-08-07T00:00:00",
"Amount": 3207,
"CCJ_Status": "Outstanding",
"Date_Satisfied": null
},
{
"CCJ_ID": 13387951,
"Case_Number": "G6EM52H0",
"Court": "COUNTY COURT BUSINESS CENTRE",
"Name": "GOFUELS LTD",
"Address": "427 CHORLEY NEW ROAD,HORWICH,BOLTON,,BL6 6DT",
"Date_Raised": "2021-01-28T00:00:00",
"Amount": 388,
"CCJ_Status": "Outstanding",
"Date_Satisfied": ""
},
{
"CCJ_ID": 13387951,
"Case_Number": "H0AT574P",
"Court": "COUNTY COURT BUSINESS CENTRE",
"Name": "GOFUELS LIMITED",
"Address": "427 CHORLEY NEW ROAD,HORWICH,BOLTON,ENGLAND,BL6 6DT",
"Date_Raised": "2021-04-07T00:00:00",
"Amount": 2568,
"CCJ_Status": "Outstanding",
"Date_Satisfied": ""
},
{
"CCJ_ID": 13387951,
"Case_Number": "H7AT6R9X",
"Court": "COUNTY COURT BUSINESS CENTRE",
"Name": null,
"Address": "427 Chorley New Rd,Horwich,Bolton,Lancashire,BL6 6DT",
"Date_Raised": "2021-12-10T00:00:00",
"Amount": 813,
"CCJ_Status": "Satisfied",
"Date_Satisfied": "2022-06-26"
}
]
}
}
]
Gazettes Notices
This API brings back existing country court judgment records for requested SME based on Company Registration Number (CRN) and optionally filter by category.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-gazette-notices/{Company-CRN}
Notice Report
Company_CRN
String
Company Registration Number associated with the notice.
Notice_Id
Integer
Unique identifier for the notice.
Notice_Code_Value
String
Code representing the type or category of notice.
Url
String
URL pointing to the notice details.
Published_Date
Date
Date when the notice was published.
Notice_Created_Date
Date
Date when the notice record was created.
Gazette Notices Playground
Gazette Notices API
Use the form to test the Gazette Notices API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "09421861",
"Gazette_Notices": [
{
"Company_CRN": "09421861",
"Notice_ID": 4230484,
"Notice_Code_Value": "2450",
"Notice_Code_Name": "PETITIONS_TO_WIND_UP_COMPANIES",
"URL": "https://www.thegazette.co.uk/notice/4230484",
"Published_Date": "2022-12-09T00:14:30",
"Notice_Created_Date": "2022-12-09"
},
{
"Company_CRN": "09421861",
"Notice_ID": 4250211,
"Notice_Code_Value": "2461",
"Notice_Code_Name": "DISMISSAL_OF_WINDING_UP_PETITION",
"URL": "https://www.thegazette.co.uk/notice/4250211",
"Published_Date": "2023-01-03T00:03:55",
"Notice_Created_Date": "2023-01-03"
}
]
}
}
]
People
Directors
This API brings back Directors information along with associated business information based on company registration number provided as input parameter to the API.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-officers/{Company-CRN}
Directors Details
Company_Id
Integer
Unique identifier for the company in the database.
Person_Id
Integer
Unique identifier for the company officer (director).
Company_Name
String
Name of the company where the officer serves.
Company_CRN
String
Company Registration Number.
Company_Status
String
Current legal status of the company.
Company_Type
String
Type of the company (e.g., Private Limited, PLC).
Title
String
Title of the company officer (e.g., Mr, Ms, Dr).
First_Name
String
First name of the company officer.
Last_Name
String
Last name of the company officer.
Nationality
String
Nationality of the company officer.
Birth_Date
Date
Date of birth of the company officer.
Address
String
Residential or correspondence address of the company officer.
Country
String
Country of residence of the company officer.
Role
String
Role of the officer in the company (e.g., Director, Secretary).
Occupation
String
Occupation of the officer (as reported).
Appointed_Date
Date
Date the officer was appointed to the role.
Directors Playground
Directors API
Use the form to test the Directors API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_Master_ID": 13387951,
"Company_CRN": "09421861",
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Incorporation_Date": "2015-02-04T00:00:00",
"Company_Officers": [
{
"Person_Id": "19468989",
"Title": "Mr",
"First_Name": "Salim",
"Last_Name": "Patel",
"Nationality": "British",
"Occupation": "Director",
"Birth_Date": "11/1965",
"Other_Appointments": "Y",
"Type": "D",
"Role": "Director",
"Appointed_Date": "2015-02-04",
"IS_Directors": "Yes",
"IS_Shareholder": "Yes",
"IS_Signatory_Director": "Yes",
"IS_Posc": "Yes",
"Shareholder_Percentage": 30,
"Resigned_Date": null,
"PostCode": null,
"Last_Updated_Datetime": null
},
{
"Person_Id": "19468991",
"Title": "Mrs",
"First_Name": "Farida",
"Last_Name": "Patel",
"Nationality": "British",
"Occupation": "Director",
"Birth_Date": "07/1970",
"Other_Appointments": "Y",
"Type": "D",
"Role": "Director",
"Appointed_Date": "2015-02-04",
"IS_Directors": "Yes",
"IS_Shareholder": "Yes",
"IS_Signatory_Director": "Yes",
"IS_Posc": "Yes",
"Shareholder_Percentage": 30,
"Resigned_Date": null,
"PostCode": null,
"Last_Updated_Datetime": null
},
{
"Person_Id": "19468992",
"Title": "Mr",
"First_Name": "Hassan",
"Last_Name": "Mohammed",
"Nationality": "British",
"Occupation": "Director",
"Birth_Date": "03/1992",
"Other_Appointments": "Y",
"Type": "D",
"Role": "Director",
"Appointed_Date": "2015-02-04",
"IS_Directors": "Yes",
"IS_Shareholder": "Yes",
"IS_Signatory_Director": "Yes",
"IS_Posc": "Yes",
"Shareholder_Percentage": 20,
"Resigned_Date": null,
"PostCode": null,
"Last_Updated_Datetime": null
},
{
"Person_Id": "20803711",
"Title": "Mr",
"First_Name": "Hussain",
"Last_Name": "Mohammed",
"Nationality": "British",
"Occupation": "Director",
"Birth_Date": "05/1996",
"Other_Appointments": "Y",
"Type": "D",
"Role": "Director",
"Appointed_Date": "2020-09-24",
"IS_Directors": "Yes",
"IS_Shareholder": "Yes",
"IS_Signatory_Director": "Yes",
"IS_Posc": "Yes",
"Shareholder_Percentage": 20,
"Resigned_Date": null,
"PostCode": null,
"Last_Updated_Datetime": null
}
]
}
}
]
Associated Companies
This API brings back Directorship information based on company registration number provided as input parameter to the API.

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-associated-companies/{Company-CRN}
Directors Details
Company_Id
Integer
Unique identifier for the company in the database.
Person_Id
Integer
Unique identifier for the company officer (director).
Company_Name
String
Name of the company where the officer serves.
Company_CRN
String
Company Registration Number.
Company_Status
String
Current legal status of the company.
Company_Type
String
Type of the company (e.g., Private Limited, PLC).
Title
String
Title of the company officer (e.g., Mr, Ms, Dr).
First_Name
String
First name of the company officer.
Last_Name
String
Last name of the company officer.
Nationality
String
Nationality of the company officer.
Birth_Date
Date
Date of birth of the company officer.
Address
String
Residential or correspondence address of the company officer.
Country
String
Country of residence of the company officer.
Role
String
Role of the officer in the company (e.g., Director, Secretary).
Occupation
String
Occupation of the officer (as reported).
Appointed_Date
Date
Date the officer was appointed to the role.
Associated Companies Playground
Associated Companies API
Use the form to test the Associated Companies API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "09421861",
"Company_ID": "13387951",
"Directors": [
{
"Job_Title": "Mr",
"First_Name": "Salim",
"Last_Name": "Patel",
"Birth_Date": "11/1965",
"Type": "D",
"Date_of_Appointment": "2015-02-04",
"Company_Person_ID": "19468989",
"Company_Master_ID": 13387951,
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_CRN": "09421861",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null,
"Directorship": [
{
"Company_Master_ID": 13611967,
"Company_CRN": "09622302",
"Company_Name": "SALIM PATEL LIMITED",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "03/06/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 14238809,
"Company_CRN": "10175297",
"Company_Name": "GOXERCISE LIMITED",
"Company_Status": "Dissolved",
"Company_Type": "LTD",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "11/05/2016",
"Nationality": "British",
"Country": "England",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": "2019-07-30T00:00:00"
},
{
"Company_Master_ID": 13387951,
"Company_CRN": "09421861",
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 22406625,
"Company_CRN": "15709692",
"Company_Name": "GOFUELS HOLDINGS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Company Director",
"Appointed_Date": "08/05/2024",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Company Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
}
]
},
{
"Job_Title": "Mrs",
"First_Name": "Farida",
"Last_Name": "Patel",
"Birth_Date": "07/1970",
"Type": "D",
"Date_of_Appointment": "2015-02-04",
"Company_Person_ID": "19468991",
"Company_Master_ID": 13387951,
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_CRN": "09421861",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null,
"Directorship": [
{
"Company_Master_ID": 13611967,
"Company_CRN": "09622302",
"Company_Name": "SALIM PATEL LIMITED",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "10/07/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 13387951,
"Company_CRN": "09421861",
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
}
]
},
{
"Job_Title": "Mr",
"First_Name": "Hassan",
"Last_Name": "Mohammed",
"Birth_Date": "03/1992",
"Type": "D",
"Date_of_Appointment": "2015-02-04",
"Company_Person_ID": "19468992",
"Company_Master_ID": 13387951,
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_CRN": "09421861",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null,
"Directorship": [
{
"Company_Master_ID": 14238809,
"Company_CRN": "10175297",
"Company_Name": "GOXERCISE LIMITED",
"Company_Status": "Dissolved",
"Company_Type": "LTD",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "11/05/2016",
"Nationality": "British",
"Country": "England",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": "2019-07-30T00:00:00"
},
{
"Company_Master_ID": 13611967,
"Company_CRN": "09622302",
"Company_Name": "SALIM PATEL LIMITED",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "10/07/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 22406625,
"Company_CRN": "15709692",
"Company_Name": "GOFUELS HOLDINGS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Company Director",
"Appointed_Date": "08/05/2024",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Company Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 13387951,
"Company_CRN": "09421861",
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "04/02/2015",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
}
]
},
{
"Job_Title": "Mr",
"First_Name": "Hussain",
"Last_Name": "Mohammed",
"Birth_Date": "05/1996",
"Type": "D",
"Date_of_Appointment": "2020-09-24",
"Company_Person_ID": "20803711",
"Company_Master_ID": 13387951,
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_CRN": "09421861",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "24/09/2020",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null,
"Directorship": [
{
"Company_Master_ID": 13387951,
"Company_CRN": "09421861",
"Company_Name": "GOFUELS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "24/09/2020",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 14238809,
"Company_CRN": "10175297",
"Company_Name": "GOXERCISE LIMITED",
"Company_Status": "Dissolved",
"Company_Type": "LTD",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "11/05/2016",
"Nationality": "British",
"Country": "England",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": "2019-07-30T00:00:00"
},
{
"Company_Master_ID": 17601589,
"Company_CRN": "12416476",
"Company_Name": "GOBITES LTD",
"Company_Status": "Dissolved",
"Company_Type": "LTD",
"Address": "543",
"Role": "Company Director",
"Appointed_Date": "21/01/2020",
"Nationality": "British",
"Country": "England",
"Occupation": "Company Director",
"Resigned_Date": "",
"Company_Went_Into_Status": "2022-03-08T00:00:00"
},
{
"Company_Master_ID": 22406625,
"Company_CRN": "15709692",
"Company_Name": "GOFUELS HOLDINGS LTD",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Company Director",
"Appointed_Date": "08/05/2024",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Company Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
},
{
"Company_Master_ID": 13611967,
"Company_CRN": "09622302",
"Company_Name": "SALIM PATEL LIMITED",
"Company_Status": "Active",
"Company_Type": "Private Limited Company",
"Address": "427 CHORLEY NEW ROAD",
"Role": "Director",
"Appointed_Date": "24/09/2020",
"Nationality": "British",
"Country": "ENGLAND",
"Occupation": "Director",
"Resigned_Date": "",
"Company_Went_Into_Status": null
}
]
}
]
}
}
]
Detailed Finacials
Filed Accounts
This API brings back financial data for requested SME based on the Company Registration Number (CRN) and optionally filter by category

Request
GET https://demo-api.mypulse-sandbox.io/v1/get-filed-accounts/{Company-CRN}
Company Information
Company_Name
String
Name of the company.
Customer_Number
Integer
Customer reference number.
Accounts Data> Profit Loss
Type
String
Type of profit and loss account.
Start_Period
String
Profit and loss period start.
End_Period
String
Profit and loss period end.
Profit_Loss
String
Profit and loss statement result.
Turnover
Integer
Total turnover for the period.
Cost_Of_Sales
Integer
Cost of sales incurred.
Gross_Profit
Integer
Gross profit achieved.
Depreciation_Amortisation
Integer
Depreciation and amortisation costs.
Profit_After_Tax
Integer
Profit after tax.
Dividends
Integer
Dividends declared.
Accounts Data> Balance Sheet
Share_Capital
Integer
Share capital value.
Intangibles
Integer
Value of intangible assets.
Current_Assets
Integer
Value of current assets.
Current_Liabilities
Integer
Value of current liabilities.
Net_Current_Asset_Position
Integer
Net current asset position.
Hp_Loan_Less_Than_A_Year
Integer
Hire purchase loan due in less than a year.
Total_Debts
Integer
Total debt obligations.
Stock
Integer
Stock held.
Total_Debtors
Integer
Value of debtors.
Total_Creditors
Integer
Value of creditors.
Tangible_Net_Worth
Integer
Tangible net worth of the business.
Accounts Data> Financial ratios
Net_Profit_Margin
Integer
Net profit margin ratio.
Gross_Profit_Margin
Integer
Gross profit margin ratio.
Operating_Profit_Margin
Integer
Operating profit margin ratio.
Days_Sales_Outstanding
Integer
Average days sales outstanding.
Current_Ratio
Integer
Current ratio.
Quick_Asset_Ratio
Integer
Quick asset ratio.
Cash_Ratio
Integer
Cash ratio.
Working_Capital_Turnover_Ratio
Integer
Working capital turnover ratio.
Asset_Turnover_Ratio
Integer
Asset turnover ratio.
Operating_Cashflow_Ratio
Integer
Operating cash flow ratio.
Return_On_Asset_Ratio
Integer
Return on asset ratio.
Return_On_Equity_Ratio
Integer
Return on equity ratio.
Interest_Coverage_Ratio
Integer
Interest coverage ratio.
Accounts Data> Cashflow
Opening_Cash_Balance
Integer
Opening cash balance.
Opening_Date
Date
Date of opening balance.
Net_Cashflow
Integer
Net cash flow for the period.
Closing_Cash_Balance
Integer
Closing cash balance.
Operating_Income
Integer
Operating income reported.
Depreciation_and_Amortisation
Integer
Depreciation and amortisation costs in cashflow.
Extraordinary_Income
Integer
Extraordinary income received.
Accounts_Receivable_Change
Integer
Change in accounts receivable.
Stock_and_Inventory_Change
Integer
Change in stock and inventory.
Other_Working_Capital_Change
Integer
Change in other working capital.
Capital_Expenditure
Integer
Capital expenditure during the period.
Proceeds_From_Sale_Of_Assets
Integer
Proceeds from asset sales.
Current_Debt_Change
Integer
Change in current debt.
Long_Term_Debt_Change
Integer
Change in long-term debt.
Other_Long_Term_Change
Integer
Other long-term changes.
Equity_or_Capital_Injections
Integer
Equity or capital injections received.
Dividends
Integer
Dividends paid out.
Other_Financing
Integer
Other financing activities.
Year
Integer
Year of the cashflow report.
Month
String
Month of the cashflow report.
Accounts Data> Cashflow> Closing Balance
Closing_balance
Integer
Closing cash balance at end of reported period.
Year
Integer
Year of closing balance report.
Month
String
Month of closing balance report.
Accounts Data> Cashflow> Assumptions
Turnover
Integer
Turnover assumed in cashflow model.
Gross_Margin
Integer
Assumed gross margin.
Expenses
Integer
Assumed expenses.
DSO_Debtors
Integer
Assumed days sales outstanding for debtors.
Inventory_Turn
Integer
Assumed inventory turn.
Purchases
Integer
Assumed purchases.
Disposals
Integer
Assumed disposals.
Equity
Integer
Assumed equity contribution.
Debt_Raise
Integer
Assumed debt raise.
Dividends
Integer
Assumed dividends.
Filed Accounts Playground
Filed Accounts API
Use the form to test the Filed Accounts API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"status": "success",
"data": {
"Company_CRN": "05024329",
"Profit_Loss": [
{
"Date": "2025-03-31T00:00:00",
"Turnover": 77613,
"Depreciation": 8126,
"Net_Profit_Pre_Tax": 25972,
"Operating_Profit": 26543,
"Profit_Loss": 52380,
"Dividends": 4000,
"Cost_Of_Sales": 25233,
"Tax": 334,
"Depriciation_And_Amortisation": 8126,
"Interest_Payable": 574,
"Post_Tax_Profit": 25638,
"Gross_Profit": 52380,
"Pre_Tax_Profit": 25972
},
{
"Date": "2024-03-31T00:00:00",
"Turnover": 38679,
"Depreciation": 2099,
"Net_Profit_Pre_Tax": 3673,
"Operating_Profit": 4458,
"Profit_Loss": 24742,
"Dividends": 4000,
"Cost_Of_Sales": 13937,
"Tax": -1140,
"Depriciation_And_Amortisation": 2099,
"Interest_Payable": 786,
"Post_Tax_Profit": 4813,
"Gross_Profit": 24742,
"Pre_Tax_Profit": 3673
},
{
"Date": "2023-03-31T00:00:00",
"Turnover": 48348,
"Depreciation": 3129,
"Net_Profit_Pre_Tax": 1766,
"Operating_Profit": 2563,
"Profit_Loss": 28450,
"Dividends": 4000,
"Cost_Of_Sales": 19898,
"Tax": 174,
"Depriciation_And_Amortisation": 3129,
"Interest_Payable": 798,
"Post_Tax_Profit": 1592,
"Gross_Profit": 28450,
"Pre_Tax_Profit": 1766
}
],
"Balance_Sheet": [
{
"Date": "2025-03-31T00:00:00",
"Current_Assets": 4111,
"Current_Liabilities": 9949,
"Revaluation_Reserve": 0,
"Long_Term_Liabilities": 0,
"Tangible_NW": 26666,
"Liquidity_Ratio": 0.41,
"Trade_Debtors": 0,
"Creditors": 1894,
"Current_Liabilities_Less_Than_1_Year": 9949,
"Current_Liabilities_Greater_1_Year": 0,
"Stocks": 86,
"Cash": 4025,
"NET_Current_Assets_Liabilities": -5838,
"Share_Capital": 100,
"Shareholders_Funds": 26666,
"Fixed_Assets": 32504,
"Trade_Creditors": 1894,
"Ebitda": 34669,
"Intangible_Assets": null
},
{
"Date": "2024-03-31T00:00:00",
"Current_Assets": 1971,
"Current_Liabilities": 5340,
"Revaluation_Reserve": 0,
"Long_Term_Liabilities": 0,
"Tangible_NW": 5028,
"Liquidity_Ratio": 0.37,
"Trade_Debtors": 0,
"Creditors": 1155,
"Current_Liabilities_Less_Than_1_Year": 5340,
"Current_Liabilities_Greater_1_Year": 0,
"Stocks": 121,
"Cash": 1850,
"NET_Current_Assets_Liabilities": -3369,
"Share_Capital": 100,
"Shareholders_Funds": 5028,
"Fixed_Assets": 8397,
"Trade_Creditors": 1155,
"Ebitda": 6557,
"Intangible_Assets": null
},
{
"Date": "2023-03-31T00:00:00",
"Current_Assets": 3120,
"Current_Liabilities": 11401,
"Revaluation_Reserve": 0,
"Long_Term_Liabilities": 0,
"Tangible_NW": 2215,
"Liquidity_Ratio": 0.27,
"Trade_Debtors": 455,
"Creditors": 1207,
"Current_Liabilities_Less_Than_1_Year": 11401,
"Current_Liabilities_Greater_1_Year": 0,
"Stocks": 164,
"Cash": 2501,
"NET_Current_Assets_Liabilities": -8281,
"Share_Capital": 100,
"Shareholders_Funds": 2215,
"Fixed_Assets": 10496,
"Trade_Creditors": 1207,
"Ebitda": 5692,
"Intangible_Assets": null
}
],
"Financial_Ratios": [
{
"Date": "2024-03-31T00:00:00",
"Net_Profit_Margin_Percentage": 12.44,
"Gross_Profit_Margin_Percentage": 63.97,
"Operating_Profit_Margin_Percentage": 11.53,
"Days_Sales_Outstanding": 0,
"Inventory_Days_On_Hand": 3.19,
"Days_Payables_Outstanding": 30.41,
"Current_Ratio": 0.37,
"Quick_Asset_Ratio": 0.35,
"Cash_Ratio": 0.35,
"Working_Capital_Income_Ratio": 11.48,
"Asset_Total_Income_Ratio": 3.73,
"Operating_Cashflow_Ratio": 0.66,
"Return_On_Assets_Ratio": 0.46,
"Return_On_Equity_Ratio": 0.96,
"Debt_To_Equity_Ratio": 1.06,
"Interest_Coverage_Ratio": 5.67,
"Debt_Service_Cover_Ratio": 8.34
},
{
"Date": "2025-03-31T00:00:00",
"Net_Profit_Margin_Percentage": 33.03,
"Gross_Profit_Margin_Percentage": 67.49,
"Operating_Profit_Margin_Percentage": 34.2,
"Days_Sales_Outstanding": 0,
"Inventory_Days_On_Hand": 1.25,
"Days_Payables_Outstanding": 27.47,
"Current_Ratio": 0.41,
"Quick_Asset_Ratio": 0.4,
"Cash_Ratio": 0.4,
"Working_Capital_Income_Ratio": 13.29,
"Asset_Total_Income_Ratio": 2.12,
"Operating_Cashflow_Ratio": 2.81,
"Return_On_Assets_Ratio": 0.7,
"Return_On_Equity_Ratio": 0.96,
"Debt_To_Equity_Ratio": 0.37,
"Interest_Coverage_Ratio": 46.24,
"Debt_Service_Cover_Ratio": 60.4
},
{
"Date": "2023-03-31T00:00:00",
"Net_Profit_Margin_Percentage": 3.29,
"Gross_Profit_Margin_Percentage": 58.84,
"Operating_Profit_Margin_Percentage": 5.3,
"Days_Sales_Outstanding": 3.44,
"Inventory_Days_On_Hand": 3.02,
"Days_Payables_Outstanding": 22.2,
"Current_Ratio": 0.27,
"Quick_Asset_Ratio": 0.26,
"Cash_Ratio": 0.22,
"Working_Capital_Income_Ratio": 5.84,
"Asset_Total_Income_Ratio": 3.55,
"Operating_Cashflow_Ratio": 0.31,
"Return_On_Assets_Ratio": 0.12,
"Return_On_Equity_Ratio": 0.72,
"Debt_To_Equity_Ratio": 5.15,
"Interest_Coverage_Ratio": 3.21,
"Debt_Service_Cover_Ratio": 7.13
}
]
}
}
]
Illustration of content on phone.
Lending APIs
Introduction
The Pulse Lending APIs enables trusted partners to seamlessly integrate with Lending Partners, providing a streamlined and efficient way to deliver fast, flexible funding solutions to small & medium size businesses.

This API exposes core functionality of the Lender platform, empowering partners to offer a complete lending experience directly from their own applications or platforms. Whether you're looking to prequalify customers, submit applications, or retrieve offers, the Pulse Lending API provides the tools you need to build a robust and scalable funding journey.

Key Capabilities:
Submit Customer Data & Applications
Submit customer profiles and loan applications for evaluation. Ensure accurate and efficient data transfer to accelerate the lending process.

Get Quotes & Offers
Instantly receive real-time funding quotes and offers tailored to the applicant’s business. Provide immediate feedback to customers, helping them make informed borrowing decision

By integrating with the Pulse Lending API, partners can enhance their financial products and services while giving SMEs access to the capital they need—quickly, securely, and reliably.

Onboarding: Pulse Lending API Integration
This process ensures a smooth and secure setup so you can begin offering embedded lending solutions to your customers.

Step 1: Partnership Approval & Access Request
Before integration, your organization must be approved as an official partner.

To request a partnership with Pulse, please email us at api.support@mypulse.io for evaluation

Once your request is approved:

You will receive your API credentials, including Client ID, Client Secret, Subscription key, Grant Type, and Scope details.

Access to the sandbox (test) environment will be provisioned.

Step 2: Authentication and Connection Management
myPulse OAuth 2.0 Securely authenticates and provides secure delegated access for third-party applications without exposing user credentials.
Authentication Steps:
Client can hit on Authentication API and use the above details to generate Bearer token.

Users need to send bearer token in the Authorization header to access protected resources.

The generated token remains active for 60 minutes. Once it expires, a new token needs to be generated. 

Once the token is generated, you can call the endpoint by including the Bearer token and the provided subscription key in the request headers.

Note: URL will be based on Environment (Sandbox or Production)
Parameter Value / Example
Header Name Ocp-Apim-Subscription-Key
Sandbox URL https://demo-api.mypulse-sandbox.io
Production URL https://prod-api.mypulse.io
Authentication URL {EnvironmentUrl}/authorization/oauth2/v2.0/token
Request Header
Request Header
API image
API image
Request Body
Request Body
API Response Codes
Code Description
200 Success
401 Your API request was not properly authorized.
404 One or more of the resources you referenced could not be found.
Step 3: Start with the Sandbox
Use the sandbox environment to test your integration.

This environment is safe for development and simulates real-time responses without impacting production systems.

Step 4: Go Live
Once your integration has been tested and approved by our technical team:
You will receive production credentials.

API endpoints will be updated to point to the live environment.

Monitoring, logging, and support agreements will be activated.

Our team will work closely with you during this phase to ensure a smooth transition.
Loan APIs
Create a Loan Application
To create a loan application for a business, use the Create-Application API endpoint.

Create Loan Application Image
Steps to Create an Application via API
API Requirements
The information provided must meet the minimum data requirements. Failure to meet these requirements will result in the application being ineligible for the Lender.

If the data is incomplete, the API will return an error code indicating the application ID cannot be created.

POST {EnvironmentUrl}/v1/Create-Application
Upon a successful request, the endpoint will return: application_id:
Unique identifier used throughout the loan journey.
Applicant Details
Consent_To_Search
Boolean
Indicates whether the user has given consent to perform a search (credit & fraud)
First_Name
String
Applicant given name
Last_Name
String
Applicant surname
Email
String
Applicant email address
Phone_Number
String
Applicant's phone number
Address
String
Full address
House_Number
String
House or building number
Flat_Number
String
Apartment or flat number (if applicable)
House_Name
String
House or building name
Street
String
Name of the street
Town
String
Name of the town or city
Postcode
String
Postal or ZIP code
Residential_Status
String
Applicant’s residential status (Owner, Tenant)
Date_Of_Birth
String
Applicant’s date of birth (String format: DD-MM-YYYY)
Percent_Of_Control
Number
Percentage of control (ownership in a company)
Role
String
Role or position held (e.g., Director, Shareholder)
Guarantor
Boolean
Indicates whether the person is a guarantor
Send_OB_Link
Boolean
Whether to send an Open Banking link to the user
Send_OA_Link
Boolean
Whether to send an Open Accounting link to the user
Company_Name
String
Name of the company associated with the user
Companies_House_ID
String
Unique identifier for the company in Companies House (Company CRN)
Last_12_Months_Turnover
Number
Turnover of the company for last 12 months
Loan_Amount
Number
Requested Loan Amount by Customer
Loan_Term
Number
Requested Loan Term by Customer
Additional_Information
String
Any notes by customer or broker
Important Notes:

1. Each application must include exactly one Applicant.
   The Applicant's contact must be designated as the Guarantor.
   All fields related to the Applicant’s contact information are mandatory.
2. The “consent_to_search” field is required and must be set to true to proceed.
   If the consent flag is false, the API request will be rejected and return an error code.
3. Customers must be clearly and explicitly informed that credit and fraud checks will be conducted.
4. Your privacy policy must include details about the sharing of customer data with Lending Partners.
   Address sample response
   Sample Response

[
{
"residential_addresses": [
{
"house_number": "42",
"flat_number": "5B",
"house_name": "Wood Acre House",
"street": "Baker Street",
"town": "London",
"postcode": "NW1 6XE",
"residential_status": "tenant"
}
]
}
]
Mandatory Information to Create a Loan Application
Information for one applicant.
The consent_to_search flag must be set to true.
If the company has more than one director, two guarantors are mandatory:
The applicant must act as one of the guarantors.
The second guarantor must be selected from the remaining directors.
Access Create Loan API
Use the form to test the Create Loan endpoint.
Get Access
Log In
Sample Body
Sample Response

[
{
"application": {
"consent_to_search": "<Boolean>"
},
"applicant": {
"first_name": "<String>",
"last_name": "<String>",
"email": "<String>",
"phone_number": "<String>",
"address": [
{
"house_number": "<String>",
"flat_number": "<String>",
"house_name": "<String>",
"street": "<String>",
"town": "<String>",
"postcode": "<String>",
"residential_status": "<String>"
}
],
"date_of_birth": "<String>",
"percent_of_control": "<Float>",
"role": "<String>",
"guarantor": "<Boolean>",
"send_ob_link": "<Boolean>",
"send_oa_link": "<Boolean>"
},
"directors": [
{
"first_name": "<String>",
"last_name": "<String>",
"email": "<String>",
"phone_number": "<String>",
"address": [
{
"house_number": "<String>",
"flat_number": "<String>",
"house_name": "<String>",
"street": "<String>",
"town": "<String>",
"postcode": "<String>",
"residential_status": "<String>"
}
],
"date_of_birth": "<String>",
"percent_of_control": "<Float>",
"role": "<String>",
"guarantor": "<Boolean>",
"send_ob_link": "<Boolean>",
"send_oa_link": "<Boolean>"
},
{
"first_name": "<String>",
"last_name": "<String>",
"email": "<String>",
"phone_number": "<String>",
"address": [
{
"house_number": "<String>",
"flat_number": "<String>",
"house_name": "<String>",
"street": "<String>",
"town": "<String>",
"postcode": "<String>",
"residential_status": "<String>"
}
],
"date_of_birth": "<String>",
"percent_of_control": "<Float>",
"role": "<String>",
"guarantor": "<Boolean>"
}
],
"company": {
"company_name": "Cool Company LTD",
"companies_house_id": "12341234",
"last_12_months_turnover": "<Number>",
"loan_amount": "<Number>",
"loan_term": "<Number>",
"additional_information": "<String>"
}
}
]
Sample Response
Sample Response

[
{
"status": "success",
"message": "Application submitted successfully",
"application_id": "abc12345",
"open_banking_link": "https://www.exampleurl.com"
}
]
Required Validation
Structure Validation
Ensure all required top-level keys exist: application, applicant, directors, and company.

Ensure all required nested objects/arrays are present and not null.

Field-Level Validation
Application
consent_to_search: Must be a boolean.

Applicant & Director
first_name, last_name: Required, non-empty strings, alphabetic characters only.

email: Must be valid email format.

phone_number: Valid phone number format (e.g., 10-digit number, country-specific).

date_of_birth: Valid date with format DD/MM/YYYY.

percent_of_control: Number between 0 and 100 (inclusive).

guarantor: Must be boolean.

Company
company_name: Required, non-empty string.

companies_house_id: Required, non-empty string.

Cross-Field / Business Rule Validation
Director total control: Sum of percent_of_control across all directors should not exceed 100%.

Guarantor presence: At least one guarantor must be true.

Application Status API
This API will be used to fetch the real-time status of a loan application from the Lender Loan Management System (LMS) using the Application ID as a reference and return the corresponding status in the response.

Create Loan Application Image
GET {EnvironmentUrl}/v1/Application-Status/{application_id}
Application Status Details
Application_ID
String
Unique identifier for the application
Company_Name
String
Name of the company associated with the application
Status
String
Current status of the application
Amount
Number
Approved Loan Amount
Term
Number
Approved Loan Term
Interest_Rate
Number
Approved Interest Rate
Repayment_Type
String
Approved Repayment Type
Repayment_Amount
Number
Approved Repayment Amount
Broker_Commission_Amount
Number
Approved Broker Commission
Access Application Status API
Use the form to test the Application Status API endpoint.
Get Access
Log In
Sample Response
Sample Response

[
{
"application_id": "<string>",
"company_name": "<string>",
"status": "<string>",
"loan_offer": {
"amount": "<Number>",
"term": "<Number>",
"interest_rate": "<Number>",
"repayment_type": "<String>",
"repayment_amount": "<Number>",
"broker_commission_amount": "<Number>"
}
}
]
The response values for Application Status are as follows:
Decline
Lender has assessed the customer but is unable to make an offer.

Reason for decline will be included in the response.

Pre-Approved
Lender has issued a tentative offer based on turnover provided for last 12 months.

This offer is subject to change once all information is received.

Approved
Lender has issued a confirmed offer letter. 

Display the offer details.

Payout
Once the deal is paid out, the status will be set to Payout.

InProgress
Lender has not yet made a decision; the application is still in progress.  

© PULSE 2025
