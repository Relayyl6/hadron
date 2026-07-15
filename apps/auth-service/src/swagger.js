import swaggerAutogen from "swagger-autogen";

const docs = {
    info: {
        title: "Auth Service API",
        description: "Auth Service API documentation",
        version: "1.0.0",
    },
    host: "localhost:6001",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/auth.route.ts"];

swaggerAutogen(outputFile, endpointsFiles, docs);