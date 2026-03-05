# Authentication

All requests to the API are authenticated by providing your API TOKEN (bearer access token). The API key should be provided as an HTTP header named Authorization.

Your API TOKEN can be found by logging into the Bizmate CRM, heading to your Account Profile and your API Key will be displayed for use in your requests as the API TOKEN.

<figure><img src="https://684232834-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FEtlFrb1D8exbjONctbCF%2Fuploads%2F3ECnx49npGYWs0Zof6lm%2Fimage.png?alt=media&#x26;token=556f7eaf-d7bc-4d61-ade9-ef9ea58ec664" alt=""><figcaption></figcaption></figure>
# Base URL

**Base URL:**&#x20;

```
https://bizmate.fasttask.net/api/v1
```

#### Making Requests:

To interact with specific functionalities of the API, you will append the appropriate endpoint to the base URL.

To make requests to the API, use the following structure:

```html
https://bizmate.fasttask.net/api/v1/{endpoint}
```

# Leads

The Leads API allows users to manage lead data by providing endpoints to create, update, and retrieve leads. This enables seamless integration with the Bizcap system for handling lead information.

####

# POST - Create Lead

## Create a lead

**Method:** <mark style="color:green;">`POST`</mark>&#x20;

**Endpoint:** `/LEAD/new`

**Maximum Length:** `255`

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

**Body:**

<table data-full-width="true"><thead><tr><th width="185">Field</th><th width="141">Field in Portal</th><th width="134">Type</th><th width="250">Example</th><th width="281"></th><th data-type="checkbox">Required?</th></tr></thead><tbody><tr><td>brokerId</td><td>Partner</td><td>string</td><td>7e8a17fd-3577-48f4-a0e4-6cb83ea204ba</td><td>Unique identifier for a broker.</td><td>true</td></tr><tr><td>brokerRepId</td><td>Partner Contact</td><td>string</td><td>7e8a17fd-3577-48f4-a0e4-6cb83ea204ba</td><td>Identifier for a broker representative.</td><td>true</td></tr><tr><td>callClientOrBroker</td><td>Call Client Or Broker</td><td>string, Enum: [ Call Client, Call Broker ]</td><td>Call Client</td><td>Flag indicating whether to call the client directly or contact the broker.</td><td>true</td></tr><tr><td>companyName</td><td>Company</td><td>string</td><td>Some Text</td><td>Name of the company.</td><td>true</td></tr><tr><td>firstName</td><td>First Name</td><td>string</td><td>Some Text</td><td>First name of the individual.</td><td>true</td></tr><tr><td>lastName</td><td>Last Name</td><td>string</td><td>Some Text</td><td>Last name of the individual.</td><td>true</td></tr><tr><td>abn</td><td>ABN</td><td>string</td><td>Some Text</td><td>Australian Business Number. For Australian Leads</td><td>false</td></tr><tr><td>acn</td><td>ACN</td><td>string</td><td>Some Text</td><td>Australian Company Number. For Australian Leads</td><td>false</td></tr><tr><td>amountRequested</td><td>Amount Requested</td><td>number</td><td>123</td><td>Amount of funding requested.</td><td>false</td></tr><tr><td>averageMonthlyTurnover</td><td>Average Monthly Turnover</td><td>number</td><td>123</td><td>Average monthly turnover of the business.</td><td>false</td></tr><tr><td>brokerContactEmail</td><td>Broker Contact Email</td><td>string</td><td>some@email.com</td><td>Email address of the broker contact</td><td>false</td></tr><tr><td>brokerContactName</td><td>Broker Contact Name</td><td>string</td><td>Some Text</td><td>Name of the broker contact</td><td>false</td></tr><tr><td>brokerContactNumber</td><td>Broker Contact Number</td><td>string</td><td>+6128884565</td><td>Phone number of the broker contact</td><td>false</td></tr><tr><td>businessAddress</td><td>Business Address</td><td>object</td><td>{<br>      "addressLine1": "string",<br>      "addressLine2": "string",<br>      "country": "string",<br>      "city": "string",<br>      "state": "string",<br>      "zipCode": "string"<br>    }</td><td>Registered address of the business.</td><td>false</td></tr><tr><td>businessStartDate</td><td>Business Start Date</td><td>string($date-time)</td><td>2024-01-01</td><td>Date when the business was established.</td><td>false</td></tr><tr><td>callOnBehalfOf</td><td>Call On Behalf Of</td><td>string</td><td>Some Text</td><td>Entity on whose behalf the call is being made.</td><td>false</td></tr><tr><td>citizenshipStatus</td><td>Citizenship Status</td><td>string, Enum: [ Permanent Resident, Temporary Resident, Citizen ]</td><td>Permanent Resident</td><td>Citizenship status of the individual.</td><td>false</td></tr><tr><td>crn</td><td>CRN</td><td>string</td><td>Some Text</td><td>Company Registration Number. For UK Leads</td><td>false</td></tr><tr><td>dateOfBirth</td><td>Date Of Birth</td><td>string($date-time)</td><td>2024-01-01</td><td>Date of birth of the individual.</td><td>false</td></tr><tr><td>documentId</td><td>Document ID</td><td>string</td><td>Some Text</td><td>Illion Document ID, for Bizcap to pull Bank Statements</td><td>false</td></tr><tr><td>driversLicenseNumber</td><td>Drivers License Number</td><td>string</td><td>Some Text</td><td>Driver's license number.</td><td>false</td></tr><tr><td>driverVersionNumber</td><td>Driver Version Number</td><td>string</td><td>Some Text</td><td>Version number of the driver's license. For NZ Leads</td><td>false</td></tr><tr><td>email</td><td>Email</td><td>string</td><td>some@email.com</td><td>Email address of the individual or business contact.</td><td>false</td></tr><tr><td>homeOwner</td><td>Home Owner</td><td>string, Enum: [ Yes, No ]</td><td>Yes</td><td>Flag indicating if the individual is a homeowner.</td><td>false</td></tr><tr><td>industryCategory</td><td>Industry Category</td><td>string</td><td>Some Text</td><td>Category of the industry the business operates in.</td><td>false</td></tr><tr><td>industry</td><td>Industry</td><td>string</td><td>Some Text</td><td>Specific industry of the business.</td><td>false</td></tr><tr><td>loanPurpose</td><td>Loan Purpose</td><td>string, Enum: [ Equipment Purchase, Inventory / Stock Purchase, Expansion &#x26; Growth, Working Capital / Cashflow, Paying off a Business Debt, Renovation, Other ]</td><td>Equipment Purchase</td><td>Purpose of the loan being requested.</td><td>false</td></tr><tr><td>notes</td><td>Notes</td><td>string</td><td>Some Text</td><td>Primary notes field</td><td>false</td></tr><tr><td>nzbn</td><td>NZBN</td><td>string</td><td>Some Text</td><td>New Zealand Business Number. For New Zealand Leads</td><td>false</td></tr><tr><td>partnerLeadReferenceId</td><td>Partner Lead Reference ID</td><td>string</td><td>Some Text</td><td>Reference identifier for Partners.</td><td>false</td></tr><tr><td>partnerNotes</td><td>Partner Notes</td><td>string</td><td>Some Text</td><td>Additional notes.</td><td>false</td></tr><tr><td>phone</td><td>Phone</td><td>string</td><td>+6128884565</td><td>Phone number of the individual or business contact.</td><td>false</td></tr><tr><td>physicalAddress</td><td>Physical Address</td><td>object</td><td>{<br>      "addressLine1": "string",<br>      "addressLine2": "string",<br>      "country": "string",<br>      "city": "string",<br>      "state": "string",<br>      "zipCode": "string"<br>    }</td><td>Physical address of the Business.</td><td>false</td></tr><tr><td>residentialAddress</td><td>Residential Address</td><td>object </td><td>{<br>      "addressLine1": "string",<br>      "addressLine2": "string",<br>      "country": "string",<br>      "city": "string",<br>      "state": "string",<br>      "zipCode": "string"<br>    }</td><td>Residential address of the individual.</td><td>false</td></tr><tr><td>secondaryEmail</td><td>Secondary Email</td><td>string</td><td>some@email.com</td><td>Secondary email address for the individual or business.</td><td>false</td></tr><tr><td>secondaryPhone</td><td>Secondary Phone</td><td>string</td><td>+6128884565</td><td>Secondary phone number for the individual or business.</td><td>false</td></tr><tr><td>soleDirector</td><td>Sole Director</td><td>string, Enum: [ Yes, No ]</td><td>Yes</td><td>Flag indicating if the individual is the sole director of the company.</td><td>false</td></tr><tr><td>suitableProducts</td><td>Suitable Products</td><td>Array of strings, Enum: [ LOC, 2nd Mortgage, Business Loan]</td><td>[ "LOC", "2nd Mortgage"]</td><td>List of suitable Bizcap products for this applicant.</td><td>false</td></tr><tr><td>tradingAddress</td><td>Trading Address</td><td>object</td><td>{<br>      "addressLine1": "string",<br>      "addressLine2": "string",<br>      "country": "string",<br>      "city": "string",<br>      "state": "string",<br>      "zipCode": "string"<br>    }</td><td>Address where the business operates or trades.</td><td>false</td></tr><tr><td>tradingName</td><td>Trading Name</td><td>string</td><td>Some Text</td><td>Trading name of the business.</td><td>false</td></tr><tr><td>uen</td><td>UEN</td><td>string</td><td>Some Text</td><td>UEN of the business</td><td>false</td></tr></tbody></table>

**Request Body Example**

<pre class="language-json" data-line-numbers><code class="lang-json"><strong>{
</strong>  "fields": {
    "brokerId": "1e51262b-4f46-4dd2-9970-f12fe67bd",
    "callClientOrBroker": "Call Client",
    "companyName": "Some Text",
    "firstName": "Some Text",
    "lastName": "Some Text",
    "abn": "AU Specific",
    "acn": "AU Specific",
    "amountRequested": 123,
    "averageMonthlyTurnover": 123,
    "brokerContactEmail": "some@email.com",
    "brokerContactName": "Some Text",
    "brokerContactNumber": "+1111111111"
    "brokerRepId": "ee458b33-0039-480a-a62d-cbccce6b",
    "businessAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "businessStartDate": "2024-01-01",
    "callOnBehalfOf": "Some Text",
    "citizenshipStatus": "Permanent Resident",
    "crn": "UK Specific",
    "dateOfBirth": "2024-01-01",
    "documentId": "Some Text",
    "driversLicenseNumber": "Some Text",
    "driverVersionNumber": "Some Text",
    "email": "some@email.com",
    "homeOwner": "Yes",
    "industry": "Some Text",
    "industryCategory": "Some Text",
    "loanPurpose": "Equipment Purchase",
    "notes": "Some Text",
    "nzbn": "Some Text",
    "partnerLeadReferenceId": "Some Text",
    "partnerNotes": "Some Text",
    "phone": "+1111111111",
    "physicalAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "residentialAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "secondaryEmail": "some@email.com",
    "secondaryPhone": "+1111111111",
    "soleDirector": "Yes",
    "suitableProducts": [
      "LOC"
    ],
    "tradingAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string"
    },
    "tradingName": "Some Text",
    "uen": "Some Text"
  }
}
</code></pre>

**Response**

{% tabs %}
{% tab title="200" %}

```json
{
  "id": "817c2962-244a-4519-bdd4-e7877",
  "fields": {
    "bankStatementsUpdateLink": "https://www.bizcap.nz/bankstatements?leadid=817c2962-244a-4519-bdd4-e7877",
    "applicationLink": "https://www.bizcap.nz/more-about-you/?lead_id=817c2962-244a-4519-bdd4-e7877",
    "partnerLeadReferenceId": "Some Text"
  }
}
```

{% endtab %}
{% endtabs %}

# GET - Retrieve Lead by ID

## Retrieve a Lead

**Method:** <mark style="color:blue;">`GET`</mark>

**Endpoint:** `/LEAD/{leadid}`

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

**Example Request (JavaScript - Fetch):**

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <API TOKEN>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch("https://bizmate.fasttask.net/api/v1/lead/{{leadid}}", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

**Example Request (cURL):**

```http
curl --location 'https://bizmate.fasttask.net/api/v1/lead/{{leadid}}' \
--header 'Authorization: Bearer <API TOKEN>'
```

**Response**

{% tabs %}
{% tab title="200" %}

```json
{
  "id": "",
  "createdAt": "2024-08-02T05:43:45.884Z",
  "createdBy": "ef62415c-ba77-41c2-9328-36ed7eced734",
  "updatedAt": "2024-08-08T00:20:23.435Z",
  "updatedBy": "e3ca507e-3f06-47b8-80d9-62e7f98a1a4e",
  "fields": {
    "status": "Converted",
    "watchers": [],
    "statusSinceDate": "2024-08-08T00:20:16.000Z",
    "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
    "delegateTo": {
      "type": "user",
      "id": ""
    },
    "lastActivityDate": null,
    "subStatus": "Banks In",
    "firstName": "Some Text",
    "lastName": "Some Text",
    "companyName": "Some Text",
    "broker": {
      "id": "",
      "name": "Test Bizcap"
    },
    "brokerRep": {
      "id": "",
      "firstName": "Test Bizcap",
      "lastName": "Partner Contact"
    },
    "residentialAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "fullAddress": "string, string, string, string, string, string"
    },
    "businessAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "fullAddress": "string, string, string, string, string, string"
    },
    "physicalAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "fullAddress": "string, string, string, string, string, string"
    },
    "tradingAddress": {
      "addressLine1": "string",
      "addressLine2": "string",
      "country": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "fullAddress": "string, string, string, string, string, string"
    },
    "nzbn": null,
    "phone": "+1111111111",
    "email": "some@email.com",
    "bankStatementsUpdateLink": "",
    "bankStatementsCreditsSenseLink": "",
    "provisoLinkPdf": "",
    "bankStatementsReceived": "No",
    "industryCategory": "Some Text",
    "industry": "Some Text",
    "dateOfBirth": "2024-01-01",
    "driversLicenseNumber": "Some Text",
    "citizenshipStatus": "Permanent Resident",
    "soleDirector": "Yes",
    "loanPurpose": "Equipment Purchase",
    "averageMonthlyTurnover": "123.00",
    "callClientOrBroker": "Call Client",
    "applicationLink": "",
    "documentId": "Some Text",
    "tradingName": "Some Text",
    "applicationCompleted": null,
    "applicationCompletedDate": null,
    "bankStatementsReceivedDate": null,
    "businessStartDate": "2024-01-01",
    "amountRequested": "123.00",
    "internalBdmUser": null,
    "secondaryPhone": "+1111111111",
    "loanType": null,
    "homeOwner": "Yes",
    "secondaryEmail": "some@email.com",
    "suitableProducts": ["LOC"],
    "driverVersionNumber": "Some Text",
    "leadSource": "API",
    "numberOfCallsMade": 0,
    "lastCallDate": null,
    "callOnBehalfOf": "Some Text",
    "partnerLeadReferenceId": "Some Text",
    "convertedDealId": ""
  }
}
```

{% endtab %}

{% tab title="400" %}

```json
{
  "error": "Invalid request"
}
```

{% endtab %}
{% endtabs %}

# GET - Retrieve List of Leads

## Retrieve Multiple Leads:

**Method:** <mark style="color:blue;">`GET`</mark>

**Endpoint:** `/LEAD`?page=\<page_number>\&pageSize=\<pagesize>

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

**Example Request (JavaScript - Fetch):**

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <API TOKEN>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch(
  "https://bizmate.fasttask.net/api/v1/lead?page=1&pageSize=100",
  requestOptions,
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

**Example Request (cURL):**

```http
curl --location 'https://bizmate.fasttask.net/api/v1/lead?page=1&pageSize=100' \
--header 'Authorization: Bearer <API TOKEN>'
```

**Response**

{% tabs %}
{% tab title="200" %}

<pre class="language-json"><code class="lang-json"><strong>[
</strong>    {
    "id": "",
    "createdAt": "2024-08-02T05:43:45.884Z",
    "createdBy": "ef62415c-ba77-41c2-9328-36ed7eced734",
    "updatedAt": "2024-08-08T00:20:23.435Z",
    "updatedBy": "e3ca507e-3f06-47b8-80d9-62e7f98a1a4e",
    "fields": {
        "status": "Converted",
        "watchers": [],
        "statusSinceDate": "2024-08-08T00:20:16.000Z",
        "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
        "delegateTo": {
            "type": "user",
            "id": ""
        },
        "lastActivityDate": null,
        "subStatus": "Banks In",
        "firstName": "Some Text",
        "lastName": "Some Text",
        "companyName": "Some Text",
        "broker": {
            "id": "",
            "name": "Test Bizcap"
        },
        "brokerRep": {
            "id": "",
            "firstName": "Test Bizcap",
            "lastName": "Partner Contact"
        },
        "residentialAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "businessAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "physicalAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "tradingAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "nzbn": null,
        "phone": "+1111111111",
        "email": "some@email.com",
        "bankStatementsUpdateLink": "",
        "bankStatementsCreditsSenseLink": "",
        "provisoLinkPdf": "",
        "bankStatementsReceived": "No",
        "industryCategory": "Some Text",
        "industry": "Some Text",
        "dateOfBirth": "2024-01-01",
        "driversLicenseNumber": "Some Text",
        "citizenshipStatus": "Permanent Resident",
        "soleDirector": "Yes",
        "loanPurpose": "Equipment Purchase",
        "averageMonthlyTurnover": "123.00",
        "callClientOrBroker": "Call Client",
        "applicationLink": "",
        "documentId": "Some Text",
        "tradingName": "Some Text",
        "applicationCompleted": null,
        "applicationCompletedDate": null,
        "bankStatementsReceivedDate": null,
        "businessStartDate": "2024-01-01",
        "amountRequested": "123.00",
        "internalBdmUser": null,
        "secondaryPhone": "+1111111111",
        "loanType": null,
        "homeOwner": "Yes",
        "secondaryEmail": "some@email.com",
        "suitableProducts": [
            "LOC"
        ],
        "driverVersionNumber": "Some Text",
        "leadSource": "API",
        "numberOfCallsMade": 0,
        "lastCallDate": null,
        "callOnBehalfOf": "Some Text",
        "partnerLeadReferenceId": "Some Text",
        "convertedDealId": ""
    }
}, 
{
    "id": "",
    "createdAt": "2024-08-02T05:43:45.884Z",
    "createdBy": "ef62415c-ba77-41c2-9328-36ed7eced734",
    "updatedAt": "2024-08-08T00:20:23.435Z",
    "updatedBy": "e3ca507e-3f06-47b8-80d9-62e7f98a1a4e",
    "fields": {
        "status": "Converted",
        "watchers": [],
        "statusSinceDate": "2024-08-08T00:20:16.000Z",
        "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
        "delegateTo": {
            "type": "user",
            "id": ""
        },
        "lastActivityDate": null,
        "subStatus": "Banks In",
        "firstName": "Some Text",
        "lastName": "Some Text",
        "companyName": "Some Text",
        "broker": {
            "id": "",
            "name": "Test Bizcap"
        },
        "brokerRep": {
            "id": "",
            "firstName": "Test Bizcap",
            "lastName": "Partner Contact"
        },
        "residentialAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "businessAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "physicalAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "tradingAddress": {
            "addressLine1": "string",
            "addressLine2": "string",
            "country": "string",
            "city": "string",
            "state": "string",
            "zipCode": "string",
            "fullAddress": "string, string, string, string, string, string"
        },
        "nzbn": null,
        "phone": "+1111111111",
        "email": "some@email.com",
        "bankStatementsUpdateLink": "",
        "bankStatementsCreditsSenseLink": "",
        "provisoLinkPdf": "",
        "bankStatementsReceived": "No",
        "industryCategory": "Some Text",
        "industry": "Some Text",
        "dateOfBirth": "2024-01-01",
        "driversLicenseNumber": "Some Text",
        "citizenshipStatus": "Permanent Resident",
        "soleDirector": "Yes",
        "loanPurpose": "Equipment Purchase",
        "averageMonthlyTurnover": "123.00",
        "callClientOrBroker": "Call Client",
        "applicationLink": "",
        "documentId": "Some Text",
        "tradingName": "Some Text",
        "applicationCompleted": null,
        "applicationCompletedDate": null,
        "bankStatementsReceivedDate": null,
        "businessStartDate": "2024-01-01",
        "amountRequested": "123.00",
        "internalBdmUser": null,
        "secondaryPhone": "+1111111111",
        "loanType": null,
        "homeOwner": "Yes",
        "secondaryEmail": "some@email.com",
        "suitableProducts": [
            "LOC"
        ],
        "driverVersionNumber": "Some Text",
        "leadSource": "API",
        "numberOfCallsMade": 0,
        "lastCallDate": null,
        "callOnBehalfOf": "Some Text",
        "partnerLeadReferenceId": "Some Text",
        "convertedDealId": ""
    }
}
]
</code></pre>

{% endtab %}

{% tab title="400" %}

```json
{
  "error": "Invalid request"
}
```

{% endtab %}
{% endtabs %}

# PATCH - Update Lead

## Update a Lead

**Method:** <mark style="color:green;">`PATCH`</mark>

**Endpoint:** `/LEAD/{leadid}`

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

Since it’s a PATCH method, we can specify only the datapoints that have changed and not the whole raw data. For example, if we would like to change the last name of a lead, below can be used:

<figure><img src="https://684232834-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FEtlFrb1D8exbjONctbCF%2Fuploads%2F78x1GDmKBpIEvkewZOXn%2Fimage.png?alt=media&#x26;token=f371768d-3ce2-42ad-8ac5-22e3b33f1cc8" alt=""><figcaption></figcaption></figure>

**All of the datapoints in the POST lead method are available to be updated via the PATCH method.**&#x20;

**Example Request (JavaScript - Fetch):**

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <API TOKEN>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch("https://bizmate.fasttask.net/api/v1/lead/{{leadid}}", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

**Example Request (cURL):**

```http
curl --location 'https://bizmate.fasttask.net/api/v1/lead/{{leadid}}' \
--header 'Authorization: Bearer <API TOKEN>'
```

**Response**

{% tabs %}
{% tab title="200" %}

```json
{
  "id": 1,
  "name": "John",
  "age": 30
}
```

{% endtab %}

{% tab title="400" %}

```json
{
  "error": "Invalid request"
}
```

{% endtab %}
{% endtabs %}

# POST - Upload Files

## Upload files to a LEAD

**Note**: Lead ID from the create lead response is required to upload files to Bizmate.

**Method:** <mark style="color:green;">`POST`</mark>&#x20;

**Endpoint:** /attachments/new

**Maximum Length:** `255`

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Authorization | `Bearer <API TOKEN>` |

**Body:**

<table data-full-width="true"><thead><tr><th width="185">Field</th><th width="141">Field in Portal</th><th width="134">Type</th><th width="250">Example</th><th width="281">Description</th><th data-type="checkbox">Required?</th></tr></thead><tbody><tr><td>entityType</td><td>LEAD</td><td>text</td><td>LEAD</td><td>Identify the entity type</td><td>true</td></tr><tr><td>entityId</td><td>LEAD_ID</td><td>text</td><td>7e8a17fd-3577-48f4-a0e4-6cb83ea204ba</td><td>Identifier for a LEAD</td><td>true</td></tr><tr><td>attachments[0][type]</td><td></td><td>text, Enum: [ Bank Statements, Proof of Identity or ID, Image ]</td><td>Bank Statements</td><td>Use the exact values as mentioned in the type</td><td>true</td></tr><tr><td>attachments[0][fileName]</td><td></td><td>text</td><td>Some Text</td><td>Name of the company.</td><td>false</td></tr><tr><td>attachments[0][file]</td><td></td><td>text</td><td>Some Text</td><td>File to be attached(only one attachment)</td><td>true</td></tr></tbody></table>

**Request Body Example:**

To upload multiple files, use the format illustrated in the **Multiple Files Upload** table, ensuring each file entry follows the structure shown, incrementing the index for each attachment.

**Type : form-data**

**Single File Upload:**

| Key                        | type | Value                  |
| -------------------------- | ---- | ---------------------- |
| entityType                 | text | LEAD                   |
| entityId                   | text | 2e22bca2-b98e-467c-b9d |
| attachments\[0]\[type]     | text | Bank Statements        |
| attachments\[0]\[fileName] | text |                        |
| attachments\[0]\[file]     | file | transaction.pdf        |

**Multiple Files Upload:**

| Key                        | type | Value                   |
| -------------------------- | ---- | ----------------------- |
| entityType                 | text | LEAD                    |
| entityId                   | text | 2e22bca2-b98e-467c-b9d  |
| attachments\[0]\[type]     | text | Bank Statements         |
| attachments\[0]\[fileName] | text |                         |
| attachments\[0]\[file]     | file | transaction.pdf         |
| attachments\[1]\[type]     | text | Proof of Identity or ID |
| attachments\[1]\[fileName] | text | Drivers_License_Front   |
| attachments\[1]\[file]     | file | license.jpg             |

**Response**

{% tabs %}
{% tab title="200(Single)" %}

```json
{
  "id": "2794fe94bf",
  "createdAt": "2024-12-03T02:31:33.939Z",
  "updatedAt": "2024-12-03T02:31:33.939Z",
  "updatedBy": "2e6-b3c078a66521",
  "createdBy": "2f078a66521",
  "fields": {
    "fileName": "transaction.pdf",
    "type": "Bank Statements",
    "entityType": "LEAD",
    "entityId": "2e22bca2-b98e-9"
  }
}
```

{% endtab %}

{% tab title="200(Multiple)" %}

<pre class="language-json"><code class="lang-json"><strong>[
</strong><strong>{
</strong>        "id": "878570914182",
        "createdAt": "2024-12-03T02:34:59.614Z",
        "updatedAt": "2024-12-03T02:34:59.614Z",
        "updatedBy": "2f7af066521",
        "createdBy": "2f7afce6-b3a66521",
        "fields": {
            "fileName": "transaction.pdf",
            "type": "Bank Statements",
            "entityType": "LEAD",
            "entityId": "2e22561ed4579"
        }
    },
    {
        "id": "4ce8412c7ff06",
        "createdAt": "2024-12-03T02:34:59.615Z",
        "updatedAt": "2024-12-03T02:34:59.615Z",
        "updatedBy": "2f7af0521",
        "createdBy": "2f7a8a66521",
        "fields": {
            "fileName": "Drivers_License_Front.jpg",
            "type": "Proof of Identity or ID",
            "entityType": "LEAD",
            "entityId": "2e22bca2-bd4579"
        }
    }
]
</code></pre>

{% endtab %}
{% endtabs %}

# GET - Retrieve Deal by ID

## Retrieve a Deal

**Method:** <mark style="color:blue;">`GET`</mark>

**Endpoint:** `/DEAL/{dealid}`

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

<table><thead><tr><th width="374">Fields</th><th>Possible Values</th></tr></thead><tbody><tr><td>loanType</td><td>New<br>Renewal<br>Add On<br>Refinance</td></tr><tr><td>status</td><td><p>Application Received<br>In Progress<br>Additional Info Required<br>Approved</p><p>Contract Requested</p><p>Contract Draft<br>Contracts Sent<br>Pending Settlement<br>Settled<br>Withdrawn</p><p>On Hold<br>Declined</p></td></tr><tr><td>subStatus(Application Received)</td><td>Banks In</td></tr><tr><td>subStatus(In Progress)</td><td>Under Review<br>Scrubbing<br>Scrubbing Complete<br>Submitted to Credit</td></tr><tr><td>subStatus(Additional Info Required)</td><td>Pending info - with customer<br>Pending info - with ISO<br>Pending info</td></tr><tr><td>subStatus(Approved)</td><td>Pending Stips<br>Pending Presentation<br>Offer Made<br>With ISO</td></tr><tr><td>subStatus(Contract Requested)</td><td>Contract Requested<br>Contract Pending Info</td></tr><tr><td>subStatus(Contract Draft)</td><td>Contract Drafting<br>Contract Drafted<br>Contract Draft - Pending Info<br>Pre-Send Review</td></tr><tr><td>subStatus(Contracts Sent)</td><td>Contract Sent<br>Sent by SS<br>Sent by DS<br>DS Contract Viewed<br>No Response</td></tr><tr><td>subStatus(Pending Settlement)</td><td><p>Contract Signed<br>Pre-Final Review</p><p>Pre-Final Review - Pending Info<br>Final Review<br>Final Review Working<br>Final Review - Pending Info<br>Pending Funding Call - Awaiting Stips<br>Pending Funding Call<br>Funding Call Complete<br>Funding Waiting Approval</p></td></tr><tr><td>subStatus(Settled)</td><td>Performing<br>Not performing<br>Defaulted<br>Closed</td></tr><tr><td>subStatus(Withdrawn)</td><td>Term too short<br>Cost<br>No longer Required<br>Loan Amount Too Low<br>Got another loan facility<br>Not Ready<br>No reason provided</td></tr><tr><td>subStatus(On Hold)</td><td>On Hold<br>On Hold - Credit<br>On Hold - Customer</td></tr><tr><td>subStatus(Declined)</td><td>Time in business too short<br>Revenue too low<br>Serviceability<br>Credit History<br>Bank statement conduct<br>ATO debt<br>Other debts<br>Not a business<br>High risk industry<br>Prohibited industry<br>Insufficient Documentation<br>Integrity of applicants<br>Has competitor loan<br>Rejected By Credit<br>Customer Declined</td></tr><tr><td>callClientOrBroker</td><td>Call Client<br>Call Broker</td></tr></tbody></table>

**Example Request (JavaScript - Fetch):**

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <API TOKEN>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch("https://bizmate.fasttask.net/api/v1/deal/{{dealid}}", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

**Example Request (cURL):**

```http
curl --location 'https://bizmate.fasttask.net/api/v1/deal/{{dealid}}' \
--header 'Authorization: Bearer <API TOKEN>'
```

**Response**

{% tabs %}
{% tab title="200" %}

```json
{
    "id": "id",
    "createdAt": "2024-08-08T00:20:15.867Z",
    "createdBy": "",
    "updatedAt": "2024-08-08T00:20:16.551Z",
    "updatedBy": "",
    "fields": {
        "status": "Application Received",
        "watchers": [
            {
                "type": "user",
                "id": ""
            }
        ],
        "statusSinceDate": "2024-08-08T00:20:16.000Z",
        "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
        "lastActivityDate": null,
        "subStatus": "Banks In",
        "name": "Some Text",
        "customer": {
            "id": "",
            "name": "Some Text"
        },
        "callClientOrBroker": "Call Client",
        "broker": {
            "id": "",
            "name": "Test Bizcap"
        },
        "brokerRep": {
            "id": "",
            "firstName": "Test Bizcap",
            "lastName": "Partner Contact"
        },
        "loanType": null,
        "internalBdmUser": null,
        "omNumberOfPayments": null,
        "omPaybackAmount": null,
        "omTermDays": null,
        "omDeclineReasons": null,
        "omCollectionFrequency": null,
        "omPrincipalAmount": null,
        "omAdvanceID": null,
        "omDateFunded": null,
        "omAdvanceType": null,
        "amount": "123.00",
        "numberOfCallsMade": 0,
        "bankStatementsCreditsSenseLink": ",
        "bankStatementsUpdateLink": null,
        "sfid": null,
        "lastCallDate": null,
        "callOnBehalfOf": "Some Text",
        "partnerLeadReferenceId": "Some Text",
        "applicationLink": ""
    }
}
```

{% endtab %}

{% tab title="400" %}

```json
{
  "error": "Invalid request"
}
```

{% endtab %}
{% endtabs %}

# GET - Retrieve List of Deals

## Retrieve a list of Deals

**Method:** <mark style="color:blue;">`GET`</mark>

**Endpoint:** `/DEAL`?page=1\&pageSize=100

**Headers:**

| Name          | Value                |
| ------------- | -------------------- |
| Content-Type  | `application/json`   |
| Authorization | `Bearer <API TOKEN>` |

**Example Request (JavaScript - Fetch):**

```javascript
const myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer <API TOKEN>");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch(
  "https://bizmate.fasttask.net/api/v1/deal?page=1&pageSize=100",
  requestOptions,
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

**Example Request (cURL):**

```http
curl --location 'https://bizmate.fasttask.net/api/v1/deal?page=1&pageSize=100' \
--header 'Authorization: Bearer <API TOKEN>'
```

**Response**

{% tabs %}
{% tab title="200" %}

```json
[
{
    "id": "id",
    "createdAt": "2024-08-08T00:20:15.867Z",
    "createdBy": "",
    "updatedAt": "2024-08-08T00:20:16.551Z",
    "updatedBy": "",
    "fields": {
        "status": "Application Received",
        "watchers": [
            {
                "type": "user",
                "id": ""
            }
        ],
        "statusSinceDate": "2024-08-08T00:20:16.000Z",
        "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
        "lastActivityDate": null,
        "subStatus": "Banks In",
        "name": "Some Text",
        "customer": {
            "id": "",
            "name": "Some Text"
        },
        "callClientOrBroker": "Call Client",
        "broker": {
            "id": "",
            "name": "Test Bizcap"
        },
        "brokerRep": {
            "id": "",
            "firstName": "Test Bizcap",
            "lastName": "Partner Contact"
        },
        "loanType": null,
        "internalBdmUser": null,
        "omNumberOfPayments": null,
        "omPaybackAmount": null,
        "omTermDays": null,
        "omDeclineReasons": null,
        "omCollectionFrequency": null,
        "omPrincipalAmount": null,
        "omAdvanceID": null,
        "omDateFunded": null,
        "omAdvanceType": null,
        "amount": "123.00",
        "numberOfCallsMade": 0,
        "bankStatementsCreditsSenseLink": ",
        "bankStatementsUpdateLink": null,
        "sfid": null,
        "lastCallDate": null,
        "callOnBehalfOf": "Some Text",
        "partnerLeadReferenceId": "Some Text",
        "applicationLink": ""
    }
},
{
    "id": "id",
    "createdAt": "2024-08-08T00:20:15.867Z",
    "createdBy": "",
    "updatedAt": "2024-08-08T00:20:16.551Z",
    "updatedBy": "",
    "fields": {
        "status": "Application Received",
        "watchers": [
            {
                "type": "user",
                "id": ""
            }
        ],
        "statusSinceDate": "2024-08-08T00:20:16.000Z",
        "subStatusSinceDate": "2024-08-08T00:20:16.000Z",
        "lastActivityDate": null,
        "subStatus": "Banks In",
        "name": "Some Text",
        "customer": {
            "id": "",
            "name": "Some Text"
        },
        "callClientOrBroker": "Call Client",
        "broker": {
            "id": "",
            "name": "Test Bizcap"
        },
        "brokerRep": {
            "id": "",
            "firstName": "Test Bizcap",
            "lastName": "Partner Contact"
        },
        "loanType": null,
        "internalBdmUser": null,
        "omNumberOfPayments": null,
        "omPaybackAmount": null,
        "omTermDays": null,
        "omDeclineReasons": null,
        "omCollectionFrequency": null,
        "omPrincipalAmount": null,
        "omAdvanceID": null,
        "omDateFunded": null,
        "omAdvanceType": null,
        "amount": "123.00",
        "numberOfCallsMade": 0,
        "bankStatementsCreditsSenseLink": ",
        "bankStatementsUpdateLink": null,
        "sfid": null,
        "lastCallDate": null,
        "callOnBehalfOf": "Some Text",
        "partnerLeadReferenceId": "Some Text",
        "applicationLink": ""
    }
}
]
```

{% endtab %}

{% tab title="400" %}

```json
{
  "error": "Invalid request"
}
```

{% endtab %}
{% endtabs %}

# Response Codes

<table><thead><tr><th width="174">Response Code</th><th width="160">Reason</th><th>Description</th></tr></thead><tbody><tr><td><mark style="color:green;"><strong>200</strong></mark></td><td>Success</td><td>Request made successfully. </td></tr><tr><td><mark style="color:red;"><strong>400</strong></mark></td><td>Bad Request</td><td>The request could not be understood by the server due to incorrect syntax. The client SHOULD NOT repeat the request without modifications.</td></tr><tr><td><mark style="color:red;"><strong>401</strong></mark></td><td>Unauthorized </td><td>This indicates that the request needs user authentication details. The client is allowed to retry the request with an appropriate Authorization header.</td></tr><tr><td><mark style="color:red;"><strong>403</strong></mark></td><td>Forbidden</td><td>This indicates that this specific user doesn't have enough access rights to get the data.</td></tr><tr><td><mark style="color:red;"><strong>404</strong></mark></td><td>Not Found</td><td>The requested resource does not exist.</td></tr></tbody></table>
# Lead Status

| Status                | Sub-Status                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New                   | <ul><li>Received </li><li>Pending Duplicate Review</li></ul>                                                                                                                         |
| Attempting Contact    | <ul><li>Attempting 1</li><li>Attempting 2</li><li>Attempting 3</li><li>Attempting 4</li></ul>                                                                                        |
| Difficulty Contacting | <ul><li>Attempting 5</li><li>Attempting 6</li><li>Attempting 7</li><li>Attempting 8</li></ul>                                                                                        |
| Waiting on Customer   | <ul><li>Call Back Customer</li><li>Doing Application</li><li>Customer requested email only</li><li>Work in progress</li><li>With Broker</li></ul>                                    |
| Not Progressing       | <ul><li>No longer Required</li><li>Not ready</li><li>No reason provided</li><li>Cost </li><li>Got another loan facility</li><li>Term too short</li><li>Loan amount too low</li></ul> |
| Closed                | <ul><li>Duplicate</li><li>Do not contact</li><li>Unqualified</li></ul>                                                                                                               |
| Unreachable           | <ul><li>Wrong details</li></ul>                                                                                                                                                      |
| Converted             | <ul><li>Banks In</li></ul>                                                                                                                                                           |

# Deal Status

| Status                   | Sub Status                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application Received     | <ul><li>Banks In</li></ul>                                                                                                                                                                                                                                                                                                                                                                                               |
| In Progress              | <ul><li>Under Review</li><li>Scrubbing</li><li>Scrubbing Complete</li><li>Submitted to Credit</li></ul>                                                                                                                                                                                                                                                                                                                  |
| Additional Info Required | <ul><li>Pending info - with customer</li><li>Pending info - with ISO</li><li>Pending info</li></ul>                                                                                                                                                                                                                                                                                                                      |
| Approved                 | <ul><li>Pending Stips</li><li>Pending Presentation</li><li>Offer Made</li><li>With ISO</li></ul>                                                                                                                                                                                                                                                                                                                         |
| Contract Requested       | <ul><li>Contract Requested</li><li>Contract Pending Info</li></ul>                                                                                                                                                                                                                                                                                                                                                       |
| Contract Draft           | <ul><li>Contract Draft</li><li>Contact Drafting</li><li>Contract Drafted</li><li>Contract Draft - Pending info</li></ul>                                                                                                                                                                                                                                                                                                 |
| Contracts Sent           | <ul><li>Contract Sent</li><li>Sent by SS</li><li>Sent by DS</li><li>DS Contract Viewed</li><li>No Response</li></ul>                                                                                                                                                                                                                                                                                                     |
| Pending Settlement       | <ul><li>Contract Signed</li><li>Pre-Final Review</li><li>Final Review</li><li>Final Review - Pending Info</li><li>Pending Funding Call</li><li>Funding Call Complete</li><li>Funding Waiting Approval</li><li>Pre-Final Review - Pending Info</li><li>Funding Call Complete - Awaiting Stips</li></ul>                                                                                                                   |
| Settled                  | <ul><li>Performing</li><li>Not performing</li><li>Defaulted</li><li>Closed</li></ul>                                                                                                                                                                                                                                                                                                                                     |
| Withdrawn                | <ul><li>Term too short</li><li>Cost</li><li>No longer Required</li><li>Loan Amount Too Low</li><li>Got another loan facility</li><li>Not Ready</li><li>No reason provided</li></ul>                                                                                                                                                                                                                                      |
| On Hold                  | <ul><li>On Hold</li><li>On Hold - Credit</li><li>On Hold - Customer</li></ul>                                                                                                                                                                                                                                                                                                                                            |
| Declined                 | <ul><li>Time in business too short</li><li>Revenue too low</li><li>Serviceability</li><li>Credit history</li><li>Bank Statement conduct</li><li>ATO debt</li><li>Other debts</li><li>Not a business</li><li>High risk industry</li><li>Prohibited industry</li><li>Insufficient Documentation</li><li>Integrity of applicants</li><li>Has competitor loan</li><li>Rejected By Credit</li><li>Customer Declined</li></ul> |
