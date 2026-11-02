import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Serves the raw openapi.yaml specification for documentation clients.
 */
export const serveOpenApiYaml = (_req: Request, res: Response): void => {
  const filePath = path.resolve(process.cwd(), 'openapi.yaml');
  if (!fs.existsSync(filePath)) {
    res.status(404).send('OpenAPI specification file not found');
    return;
  }
  res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
  res.sendFile(filePath);
};

/**
 * Serves the modern Stoplight Elements API documentation portal.
 */
export const serveStoplightUi = (_req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>REST API Documentation | Stoplight Elements</title>
    <link rel="icon" type="image/x-icon" href="https://stoplight.io/favicon.ico">
    <!-- Stoplight Elements Web Component & Stylesheet -->
    <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #0f172a;
      }
    </style>
  </head>
  <body>
    <elements-api
      apiDescriptionUrl="/openapi.yaml"
      router="hash"
      layout="sidebar"
    />
  </body>
</html>`);
};
