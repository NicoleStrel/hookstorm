"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ExampleTabsProps {
  examplePayload: any
}

export default function ExampleTabs({ examplePayload }: ExampleTabsProps) {
  return (
    <Tabs defaultValue="curl" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="curl">cURL</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
        <TabsTrigger value="postman">Postman</TabsTrigger>
        <TabsTrigger value="nodejs">Node.js</TabsTrigger>
        <TabsTrigger value="python">Python</TabsTrigger>
      </TabsList>

      <TabsContent value="curl" className="mt-4">
        <div className="text-sm">
          <h4 className="font-medium mb-2">Using cURL:</h4>
          <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
            {`curl -X POST https://www.hookstorm.com/id \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(examplePayload)}'`}
          </pre>
        </div>
      </TabsContent>

      <TabsContent value="github" className="mt-4">
        <div className="text-sm">
          <h4 className="font-medium mb-2">Using GitHub Actions:</h4>
          <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
            {`name: Send Webhook
on: [push]
jobs:
  send-webhook:
    runs-on: ubuntu-latest
    steps:
      - name: Send webhook
        uses: actions/github-script@v6
        with:
          script: |
            const payload = ${JSON.stringify(examplePayload, null, 2)};
            await fetch('https://www.hookstorm.com/id', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });`}
          </pre>
        </div>
      </TabsContent>

      <TabsContent value="postman" className="mt-4">
        <div className="text-sm">
          <h4 className="font-medium mb-2">Using Postman:</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open Postman and create a new request</li>
            <li>
              Set the request method to <code className="bg-muted px-1 py-0.5 rounded">POST</code>
            </li>
            <li>
              Enter the URL:{" "}
              <code className="bg-muted px-1 py-0.5 rounded">https://www.hookstorm.com/id</code>
            </li>
            <li>
              Go to the "Headers" tab and add <code className="bg-muted px-1 py-0.5 rounded">Content-Type</code> with
              value <code className="bg-muted px-1 py-0.5 rounded">application/json</code>
            </li>
            <li>Go to the "Body" tab, select "raw" and "JSON", and paste the following:</li>
          </ol>
          <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto mt-2">
            {JSON.stringify(examplePayload, null, 2)}
          </pre>
        </div>
      </TabsContent>

      <TabsContent value="nodejs" className="mt-4">
        <div className="text-sm">
          <h4 className="font-medium mb-2">Using Node.js:</h4>
          <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
            {`// Using fetch (Node.js 18+)
async function sendWebhook() {
  const response = await fetch('https://www.hookstorm.com/id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(${JSON.stringify(examplePayload)}),
  });
  
  const data = await response.json();
  console.log(data);
}

sendWebhook();`}
          </pre>
        </div>
      </TabsContent>

      <TabsContent value="python" className="mt-4">
        <div className="text-sm">
          <h4 className="font-medium mb-2">Using Python:</h4>
          <pre className="rounded bg-muted p-3 font-mono text-xs overflow-x-auto">
            {`import requests
import json

url = "https://www.hookstorm.com/id"
payload = ${JSON.stringify(examplePayload, null, 2)}
headers = {"Content-Type": "application/json"}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.text)`}
          </pre>
        </div>
      </TabsContent>
    </Tabs>
  )
}
