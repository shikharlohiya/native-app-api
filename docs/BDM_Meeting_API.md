# BDM Meeting Statistics API Documentation

This document provides information about the BDM Meeting Statistics APIs, which allow you to retrieve statistics about BDM meetings, field visits, and various types of visits.

## API Endpoints

### 1. Basic BDM Statistics (Single BDM)

**Endpoint:** `GET /api/bdm/statistics`

**Description:** Get basic statistics about BDM meetings, field visits, and various types of visits.

**Query Parameters:**
- `bdmId` (required): The ID of the BDM to get statistics for.
- `startDate` (required): The start date (format: YYYY-MM-DD).
- `endDate` (required): The end date (format: YYYY-MM-DD).

**Example Request:**
```
GET /api/bdm/statistics?bdmId=123&startDate=2023-06-01&endDate=2023-06-30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "bdm": {
      "id": 123,
      "name": "John Doe"
    },
    "date_range": {
      "start_date": "2023-06-01",
      "end_date": "2023-06-30"
    },
    "summary": {
      "total_meetings": 20,
      "total_unique_meetings": 15,
      "total_field_visits": 8,
      "total_unique_field_visits": 6,
      "total_group_meetings": 3,
      "ro_visit": 2,
      "ho_visit": 1,
      "bo_visit": 0
    },
    "details": {
      "meetings": [
        {
          "date": "2023-06-01",
          "unique_meetings": 3
        },
        {
          "date": "2023-06-02",
          "unique_meetings": 2
        }
      ],
      "field_visits": [
        {
          "date": "2023-06-01",
          "count": 2
        }
      ],
      "group_meetings": [
        {
          "date": "2023-06-03",
          "count": 1
        }
      ],
      "visits": [
        {
          "specific_action": "RO Visit",
          "count": 2
        },
        {
          "specific_action": "HO Visit",
          "count": 1
        }
      ]
    }
  }
}
```

### 2. BDM Statistics for All BDMs

**Endpoint:** `GET /api/bdm/statistics/all`

**Description:** Get statistics about meetings, field visits, and various types of visits for all active BDMs (employees with role ID 2).

**Query Parameters:**
- `startDate` (required): The start date (format: YYYY-MM-DD).
- `endDate` (required): The end date (format: YYYY-MM-DD).

**Example Request:**
```
GET /api/bdm/statistics/all?startDate=2023-06-01&endDate=2023-06-30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "date_range": {
      "start_date": "2023-06-01",
      "end_date": "2023-06-30"
    },
    "bdm_count": 3,
    "summary": {
      "total_meetings": 53,
      "total_unique_meetings": 37,
      "total_field_visits": 19,
      "total_unique_field_visits": 15,
      "total_group_meetings": 6,
      "ro_visit": 3,
      "ho_visit": 4,
      "bo_visit": 3
    },
    "bdms": [
      {
        "bdm": {
          "id": 123,
          "name": "John Doe"
        },
        "statistics": {
          "total_meetings": 20,
          "total_unique_meetings": 15,
          "total_field_visits": 8,
          "total_unique_field_visits": 6,
          "total_group_meetings": 3,
          "ro_visit": 2,
          "ho_visit": 1,
          "bo_visit": 0
        }
      },
      {
        "bdm": {
          "id": 124,
          "name": "Jane Smith"
        },
        "statistics": {
          "total_meetings": 18,
          "total_unique_meetings": 12,
          "total_field_visits": 5,
          "total_unique_field_visits": 4,
          "total_group_meetings": 2,
          "ro_visit": 1,
          "ho_visit": 2,
          "bo_visit": 1
        }
      },
      {
        "bdm": {
          "id": 125,
          "name": "Bob Johnson"
        },
        "statistics": {
          "total_meetings": 15,
          "total_unique_meetings": 10,
          "total_field_visits": 6,
          "total_unique_field_visits": 5,
          "total_group_meetings": 1,
          "ro_visit": 0,
          "ho_visit": 1,
          "bo_visit": 2
        }
      }
    ]
  }
}
```

### 3. Detailed BDM Activity Information

**Endpoint:** `GET /api/bdm/activities/detailed`

**Description:** Get detailed information about each meeting, field visit, and other activities for a specific BDM.

**Query Parameters:**
- `bdmId` (required): The ID of the BDM to get detailed activities for.
- `startDate` (required): The start date (format: YYYY-MM-DD).
- `endDate` (required): The end date (format: YYYY-MM-DD).

**Example Request:**
```
GET /api/bdm/activities/detailed?bdmId=123&startDate=2023-06-01&endDate=2023-06-30
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "bdm": {
      "id": 123,
      "name": "John Doe"
    },
    "date_range": {
      "start_date": "2023-06-01",
      "end_date": "2023-06-30"
    },
    "summary": {
      "total_meetings": 3,
      "total_unique_meetings": 2,
      "total_field_visits": 2,
      "total_unique_field_visits": 2,
      "total_group_meetings": 1,
      "ro_visit": 1,
      "ho_visit": 1,
      "bo_visit": 0
    },
    "details": {
      "meetings": [
        {
          "id": 101,
          "LeadId": 201,
          "specific_action": "Meeting",
          "action_date": "2023-06-15T10:00:00.000Z",
          "remarks": "Discussed project requirements",
          "task_name": "Initial Meeting",
          "completion_status": "completed",
          "Lead": {
            "id": 201,
            "CustomerName": "ABC Company",
            "MobileNo": "1234567890",
            "CustomerMailId": "contact@abc.com",
            "location": "New Delhi",
            "category": "Poultry",
            "sub_category": "Broiler"
          }
        },
        {
          "id": 102,
          "LeadId": 202,
          "specific_action": "Meeting",
          "action_date": "2023-06-10T14:30:00.000Z",
          "remarks": "Follow-up meeting",
          "task_name": "Follow-up",
          "completion_status": "completed",
          "Lead": {
            "id": 202,
            "CustomerName": "XYZ Industries",
            "MobileNo": "9876543210",
            "CustomerMailId": "info@xyz.com",
            "location": "Mumbai",
            "category": "Poultry",
            "sub_category": "Layer"
          }
        }
      ],
      "field_visits": [
        {
          "id": 301,
          "LeadDetailId": 201,
          "BirdsCapacity": 10000,
          "LandDimension": "100x200",
          "ShedSize": "80x180",
          "IsLandDirectionEastWest": true,
          "DirectionDeviationDegree": 5,
          "ElectricityPower": true,
          "Water": true,
          "ApproachRoad": true,
          "ModelType": "Parivartan",
          "EstimationRequirement": true,
          "Image": ["url1.jpg", "url2.jpg"],
          "category": "Poultry",
          "sub_category": "Broiler",
          "closure_month": "2023-07",
          "follow_up_date": "2023-06-20",
          "ActionType": "Site Visit",
          "remark": "Good location for poultry farm",
          "createdAt": "2023-06-05T09:00:00.000Z",
          "Lead_Detail": {
            "id": 201,
            "CustomerName": "ABC Company",
            "MobileNo": "1234567890",
            "CustomerMailId": "contact@abc.com",
            "location": "New Delhi",
            "category": "Poultry",
            "sub_category": "Broiler"
          }
        }
      ],
      "group_meetings": [
        {
          "id": 401,
          "group_id": "GM001",
          "group_meeting_title": "Poultry Farmers Meet",
          "customer_name": "Various Farmers",
          "mobile": "1234567890",
          "location": "Community Hall, Delhi",
          "pincode": "110001",
          "is_unique": true,
          "action_type": "group_meeting",

          "created_at": "2023-06-25T11:00:00.000Z"
        }
      ],
      "visits": {
        "ro_visit": [
          {
            "id": 501,
            "LeadId": 203,
            "specific_action": "RO Visit",
            "action_date": "2023-06-18T10:00:00.000Z",
            "remarks": "Visited regional office",
            "task_name": "RO Visit",
            "completion_status": "completed",
            "Lead": {
              "id": 203,
              "CustomerName": "PQR Farms",
              "MobileNo": "5556667777",
              "CustomerMailId": "contact@pqr.com",
              "location": "Pune",
              "category": "Poultry",
              "sub_category": "Broiler"
            }
          }
        ],
        "ho_visit": [
          {
            "id": 502,
            "LeadId": 204,
            "specific_action": "HO Visit",
            "action_date": "2023-06-22T14:00:00.000Z",
            "remarks": "Visited head office",
            "task_name": "HO Visit",
            "completion_status": "completed",
            "Lead": {
              "id": 204,
              "CustomerName": "LMN Enterprises",
              "MobileNo": "8889990000",
              "CustomerMailId": "info@lmn.com",
              "location": "Bangalore",
              "category": "Poultry",
              "sub_category": "Layer"
            }
          }
        ],
        "bo_visit": []
      }
    }
  }
}
```

### 4. Detailed BDM Meeting Report

**Endpoint:** `GET /api/bdm/meeting-report`

**Description:** Get a detailed report of BDM meetings and visits with various filtering options and aggregation capabilities.

**Query Parameters:**
- `bdmId` (required): The ID of the BDM to get statistics for.
- `startDate` (required): The start date (format: YYYY-MM-DD).
- `endDate` (required): The end date (format: YYYY-MM-DD).
- `groupBy` (optional): How to group the results. Possible values:
  - `day`: Group by day (default)
  - `week`: Group by week
  - `month`: Group by month
- `includeDetails` (optional): Whether to include detailed meeting information. Possible values:
  - `true`: Include details
  - `false`: Do not include details (default)

**Example Request:**
```
GET /api/bdm/meeting-report?bdmId=123&startDate=2023-06-01&endDate=2023-06-30&groupBy=week&includeDetails=true
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "bdm": {
      "id": 123,
      "name": "John Doe"
    },
    "date_range": {
      "start_date": "2023-06-01",
      "end_date": "2023-06-30",
      "group_by": "week"
    },
    "summary": {
      "total_unique_meetings": 15,
      "total_field_visits": 8,
      "total_group_meetings": 3,
      "ro_visit": 2,
      "ho_visit": 1,
      "bo_visit": 0
    },
    "by_date": {
      "meetings": [
        {
          "date_group": "2023-22",
          "unique_meetings": 5
        },
        {
          "date_group": "2023-23",
          "unique_meetings": 10
        }
      ],
      "field_visits": [
        {
          "date_group": "2023-22",
          "count": 3
        },
        {
          "date_group": "2023-23",
          "count": 5
        }
      ],
      "group_meetings": [
        {
          "date_group": "2023-22",
          "count": 1
        },
        {
          "date_group": "2023-23",
          "count": 2
        }
      ],
      "visits": {
        "2023-22": {
          "ro_visit": 1,
          "ho_visit": 0,
          "bo_visit": 0
        },
        "2023-23": {
          "ro_visit": 1,
          "ho_visit": 1,
          "bo_visit": 0
        }
      }
    },
    "details": [
      {
        "id": 1,
        "LeadId": 101,
        "specific_action": "Meeting",
        "action_date": "2023-06-01T10:00:00.000Z",
        "remarks": "Discussed project requirements",
        "task_name": "Initial Meeting",
        "completion_status": "completed",
        "Lead": {
          "CustomerName": "ABC Company",
          "MobileNo": "1234567890",
          "location": "New Delhi"
        }
      }
    ]
  }
}
```

## Data Definitions

### Meeting Types

- **Total Meetings**: Total count of all meetings (from bdm_lead_actions table with specific_action = 'Meeting')
- **Unique Meetings**: Meetings with unique leads (from bdm_lead_actions table with specific_action = 'Meeting')
- **Total Field Visits**: Total count of all site visits (from site_visit table)
- **Unique Field Visits**: Site visits with unique leads (from site_visit table)
- **Group Meetings**: Group meetings recorded in the group_meetings table
- **RO Visit**: Regional Office visits (from bdm_lead_actions table with specific_action = 'RO Visit')
- **HO Visit**: Head Office visits (from bdm_lead_actions table with specific_action = 'HO Visit')
- **BO Visit**: Branch Office visits (from bdm_lead_actions table with specific_action = 'BO Visit')

### Time Periods

- **Day**: Calendar day (YYYY-MM-DD)
- **Week**: Calendar week (YYYY-WW)
- **Month**: Calendar month (YYYY-MM)

## Error Codes

- **400**: Bad Request - Missing or invalid parameters
- **404**: Not Found - BDM not found
- **500**: Internal Server Error - Server-side error

## Notes

- All date parameters should be in YYYY-MM-DD format.
- The API uses UTC timezone for all date calculations.
- The 'includeDetails' parameter can significantly increase the response size, use it only when necessary.
