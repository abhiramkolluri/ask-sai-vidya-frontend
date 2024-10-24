# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## To get started

Navigate to the project directory:

## Check `.env.local` file

If the `.env.local` file doesn't exists, create one and ensure that `REACT_APP_BASE_API_SERVER` is pointing to the correct backend server.

```
REACT_APP_BASE_API_SERVER = http://localhost:8000
```

or for using the prod, for example, point it to the Prod URL:

```
REACT_APP_BASE_API_SERVER = https://qrsmk74u20.execute-api.us-east-1.amazonaws.com/prod
```

### `npm install`

This installs the required repository to the application.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.
