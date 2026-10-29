export interface IconItem {
  id: string;
  name: string;
  category: "cloud" | "database" | "backend" | "frontend" | "security" | "emoji";
  isEmoji?: boolean;
}

export const ICON_CATEGORIES = [
  { id: "all", label: "All Icons" },
  { id: "cloud", label: "Cloud & DevOps" },
  { id: "database", label: "Databases & Queues" },
  { id: "backend", label: "Backend & Languages" },
  { id: "frontend", label: "Frontend & Web" },
  { id: "security", label: "Security & APIs" },
  { id: "emoji", label: "Emoji Glyphs" },
] as const;

export const POPULAR_ICONS: IconItem[] = [
  // Cloud & DevOps
  { id: "logos:aws", name: "AWS Cloud", category: "cloud" },
  { id: "logos:aws-ec2", name: "AWS EC2", category: "cloud" },
  { id: "logos:aws-s3", name: "AWS S3", category: "cloud" },
  { id: "logos:aws-lambda", name: "AWS Lambda", category: "cloud" },
  { id: "logos:google-cloud", name: "Google Cloud", category: "cloud" },
  { id: "logos:microsoft-azure", name: "Microsoft Azure", category: "cloud" },
  { id: "logos:docker-icon", name: "Docker Container", category: "cloud" },
  { id: "logos:kubernetes", name: "Kubernetes K8s", category: "cloud" },
  { id: "logos:terraform-icon", name: "Terraform IaC", category: "cloud" },
  { id: "logos:cloudflare", name: "Cloudflare CDN", category: "cloud" },
  { id: "logos:nginx", name: "Nginx Gateway", category: "cloud" },
  { id: "logos:github-actions", name: "GitHub Actions", category: "cloud" },

  // Databases & Queues
  { id: "logos:postgresql", name: "PostgreSQL DB", category: "database" },
  { id: "logos:mysql-icon", name: "MySQL DB", category: "database" },
  { id: "logos:mongodb-icon", name: "MongoDB", category: "database" },
  { id: "logos:redis", name: "Redis Cache", category: "database" },
  { id: "logos:elasticsearch", name: "Elasticsearch", category: "database" },
  { id: "logos:apache-kafka-icon", name: "Apache Kafka", category: "database" },
  { id: "logos:graphql", name: "GraphQL API", category: "database" },
  { id: "logos:supabase-icon", name: "Supabase DB", category: "database" },
  { id: "logos:firebase", name: "Firebase", category: "database" },
  { id: "logos:sqlite", name: "SQLite", category: "database" },

  // Backend & Languages
  { id: "logos:nodejs-icon", name: "Node.js", category: "backend" },
  { id: "logos:python", name: "Python", category: "backend" },
  { id: "logos:go", name: "Golang", category: "backend" },
  { id: "logos:java", name: "Java Spring", category: "backend" },
  { id: "logos:rust", name: "Rust", category: "backend" },
  { id: "logos:fastapi-icon", name: "FastAPI", category: "backend" },
  { id: "logos:dotnet", name: ".NET Core", category: "backend" },
  { id: "logos:ruby", name: "Ruby on Rails", category: "backend" },

  // Frontend & Web
  { id: "logos:react", name: "React", category: "frontend" },
  { id: "logos:nextjs-icon", name: "Next.js", category: "frontend" },
  { id: "logos:vue", name: "Vue.js", category: "frontend" },
  { id: "logos:angular-icon", name: "Angular", category: "frontend" },
  { id: "logos:typescript-icon", name: "TypeScript", category: "frontend" },
  { id: "logos:tailwind-css-icon", name: "Tailwind CSS", category: "frontend" },
  { id: "logos:flutter", name: "Flutter", category: "frontend" },
  { id: "logos:vitejs", name: "Vite Tool", category: "frontend" },

  // Security & APIs
  { id: "carbon:security", name: "Security / WAF", category: "security" },
  { id: "logos:auth0-icon", name: "Auth0", category: "security" },
  { id: "carbon:password", name: "2FA Auth", category: "security" },
  { id: "logos:stripe", name: "Stripe Pay", category: "security" },
  { id: "logos:sendgrid-icon", name: "SendGrid Email", category: "security" },
  { id: "logos:slack-icon", name: "Slack Alerts", category: "security" },
  { id: "carbon:api", name: "API Gateway", category: "security" },
  { id: "carbon:cloud-monitoring", name: "Monitoring", category: "security" },
  { id: "carbon:network-enterprise", name: "VPC Network", category: "security" },

  // Emojis
  { id: "☁️", name: "Cloud", category: "emoji", isEmoji: true },
  { id: "⚡", name: "Lightning", category: "emoji", isEmoji: true },
  { id: "🚀", name: "Rocket", category: "emoji", isEmoji: true },
  { id: "🛡️", name: "Shield", category: "emoji", isEmoji: true },
  { id: "🔒", name: "Lock", category: "emoji", isEmoji: true },
  { id: "🗄️", name: "Cabinet", category: "emoji", isEmoji: true },
  { id: "📦", name: "Package", category: "emoji", isEmoji: true },
  { id: "🔄", name: "Sync", category: "emoji", isEmoji: true },
  { id: "⚙️", name: "Gear", category: "emoji", isEmoji: true },
  { id: "🌐", name: "Globe", category: "emoji", isEmoji: true },
  { id: "📊", name: "Chart", category: "emoji", isEmoji: true },
  { id: "🔔", name: "Bell", category: "emoji", isEmoji: true },
  { id: "💳", name: "Credit Card", category: "emoji", isEmoji: true },
  { id: "🤖", name: "Bot", category: "emoji", isEmoji: true },
  { id: "📡", name: "Satellite", category: "emoji", isEmoji: true },
  { id: "👥", name: "Users", category: "emoji", isEmoji: true },
];
