<h1>Brookside – Backend</h1>

<h2>Overview</h2>
<p>
This is the backend of a collaborative podcast recording platform built using a microservices architecture.
</p>

<p>
The goal of this project is to simulate a real-world system where users can:
</p>

<ul>
  <li>Register and log in</li>
  <li>Create podcast sessions</li>
  <li>Join sessions</li>
  <li>End sessions</li>
  <li>Automatically generate and publish an episode with recorded audio</li>
  <li>Listen to published episodes</li>
</ul>

<p>
The backend is structured to reflect production-level architecture using service separation and containerization.
</p>

<h2>Architecture</h2>

<p>The backend is divided into four services:</p>

<ul>
  <li><strong>auth-service</strong></li>
  <li><strong>session-service</strong></li>
  <li><strong>podcast-service</strong></li>
  <li><strong>api-gateway</strong></li>
</ul>

<h3>Auth Service</h3>
<p>Handles:</p>
<ul>
  <li>User registration</li>
  <li>Login</li>
  <li>JWT generation</li>
  <li>Token verification</li>
</ul>
<p>
This service is responsible only for authentication and user identity.
</p>

<h3>Session Service</h3>
<p>Handles:</p>
<ul>
  <li>Creating sessions</li>
  <li>Joining sessions</li>
  <li>Ending sessions</li>
  <li>Forwarding recorded audio to the podcast service</li>
</ul>
<p>
When a session ends, this service internally calls the podcast service to upload audio and publish the episode.
</p>

<h3>Podcast Service</h3>
<p>Handles:</p>
<ul>
  <li>Creating podcasts</li>
  <li>Creating draft episodes</li>
  <li>Uploading episode audio to Cloudinary</li>
  <li>Publishing episodes</li>
  <li>Listing public episodes</li>
</ul>
<p>
Audio files are stored in Cloudinary, and only the URL is saved in the database.
</p>

<h3>API Gateway</h3>
<p>
Acts as a single entry point to the system.
</p>

<p>Responsibilities:</p>
<ul>
  <li>Routes requests to correct services</li>
  <li>Validates JWT tokens</li>
  <li>Keeps internal services hidden</li>
</ul>
<p>
All external requests go through the gateway.
</p>

<h2>Episode Publishing Flow</h2>

<ol>
  <li>User logs in and receives a JWT token.</li>
  <li>Host creates a session.</li>
  <li>A draft episode is created internally.</li>
  <li>When the host ends the session, the recorded audio file is sent.</li>
  <li>The session service forwards the file to the podcast service.</li>
  <li>The podcast service uploads the file to Cloudinary.</li>
  <li>The episode is marked as published.</li>
  <li>The session service returns the final response including:
    <ul>
      <li>episodeId</li>
      <li>audioUrl</li>
      <li>status</li>
    </ul>
  </li>
</ol>

<p>
The frontend does not directly call the upload API.
</p>

<h2>Tech Stack</h2>

<ul>
  <li>Node.js</li>
  <li>Express</li>
  <li>MongoDB</li>
  <li>JWT</li>
  <li>Multer (for handling file uploads)</li>
  <li>Cloudinary (for storing audio)</li>
  <li>Docker</li>
  <li>Docker Compose</li>
</ul>

<h2>Running Locally</h2>

<p>To run all services:</p>

<pre><code>docker-compose up --build</code></pre>

<p>
Each service runs in its own container.
</p>

<h2>Environment Variables</h2>

<p>Each service requires environment variables such as:</p>

<ul>
  <li>PORT</li>
  <li>MONGO_URL</li>
  <li>JWT_SECRET</li>
  <li>INTERNAL_KEY</li>
  <li>CLOUDINARY_NAME</li>
  <li>CLOUDINARY_API_KEY</li>
  <li>CLOUDINARY_API_SECRET</li>
</ul>

<p>
Environment files are not committed to the repository.
</p>

<h2>Design Approach</h2>

<ul>
  <li>Services are separated for scalability and clarity.</li>
  <li>API Gateway pattern is used to centralize access.</li>
  <li>Internal service communication is protected.</li>
  <li>Media storage is handled externally using Cloudinary.</li>
  <li>Docker is used to containerize services.</li>
</ul>

<p>
This backend focuses on structure, workflow clarity, and production-style design rather than just CRUD operations.
</p>
