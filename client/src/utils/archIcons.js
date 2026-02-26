/**
 * Architecture diagram icon library.
 * Each icon has: id, category, label, viewBox, path (SVG), defaultColor
 */
export const ARCH_CATEGORIES = [
    { id: 'general', label: 'General' },
    { id: 'compute', label: 'Compute' },
    { id: 'storage', label: 'Storage & DB' },
    { id: 'network', label: 'Networking' },
    { id: 'devops', label: 'DevOps & CI/CD' },
    { id: 'security', label: 'Security' },
    { id: 'messaging', label: 'Messaging' },
];

export const ARCH_ICONS = [
    // ── General ──
    { id: 'user', category: 'general', label: 'User', color: '#6366f1', viewBox: '0 0 24 24', path: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'users', category: 'general', label: 'Users', color: '#818cf8', viewBox: '0 0 24 24', path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { id: 'cloud', category: 'general', label: 'Cloud', color: '#8b5cf6', viewBox: '0 0 24 24', path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' },
    { id: 'api', category: 'general', label: 'API Gateway', color: '#ec4899', viewBox: '0 0 24 24', path: 'M14 12l-2-2-2 2 2 2 2-2zM4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm3 15l1.41-1.41L5.83 13H10v-2H5.83l2.58-2.59L7 7l-5 5 5 5zm10-10l-1.41 1.41L18.17 11H14v2h4.17l-2.58 2.59L17 17l5-5-5-5z' },
    { id: 'browser', category: 'general', label: 'Web App', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zM5 5.5h1v1H5v-1zm2 0h1v1H7v-1zm2 0h1v1H9v-1z' },
    { id: 'mobile', category: 'general', label: 'Mobile App', color: '#a855f7', viewBox: '0 0 24 24', path: 'M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zM11.5 22c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z' },
    { id: 'microservice', category: 'general', label: 'Microservice', color: '#14b8a6', viewBox: '0 0 24 24', path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z' },
    { id: 'desktop', category: 'general', label: 'Desktop', color: '#64748b', viewBox: '0 0 24 24', path: 'M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z' },

    // ── Compute ──
    { id: 'server', category: 'compute', label: 'Server', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M4 1h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm0 8h16c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2zM7 4h2v2H7V4zm0 8h2v2H7v-2z' },
    { id: 'ec2', category: 'compute', label: 'EC2 Instance', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm4 2h4v2h-4V8zm0 4h4v2h-4v-2z' },
    { id: 'lambda', category: 'compute', label: 'Lambda', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M5 20l4-16h2l3 10 3-10h2l-4 16h-2L10 10 7 20H5z' },
    { id: 'container', category: 'compute', label: 'Container', color: '#0ea5e9', viewBox: '0 0 24 24', path: 'M2 4h20v4H2V4zm0 6h20v4H2v-4zm0 6h20v4H2v-4zM4 6h4v1H4V6zm0 6h4v1H4v-1zm0 6h4v1H4v-1z' },
    { id: 'docker', category: 'compute', label: 'Docker', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M4 10h3V7H4v3zm4 0h3V7H8v3zm0 4h3v-3H8v4zm4-4h3V7h-3v3zm0 4h3v-3h-3v4zm4-8v3h3V6h-3zm-8 8h3v-3H8v4zM2 17c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5H2z' },
    { id: 'kubernetes', category: 'compute', label: 'Kubernetes', color: '#3b82f6', viewBox: '0 0 24 24', path: 'M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l6.42 3.57v7.14L12 18.46 5.58 14.89V7.75L12 4.18zM12 8a4 4 0 100 8 4 4 0 000-8z' },
    { id: 'fargate', category: 'compute', label: 'Fargate', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-4 10H8v-2h8v2zm2-4H6v-2h12v2z' },
    { id: 'ecs', category: 'compute', label: 'ECS', color: '#f97316', viewBox: '0 0 24 24', path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z' },
    { id: 'vm', category: 'compute', label: 'Virtual Machine', color: '#84cc16', viewBox: '0 0 24 24', path: 'M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z' },

    // ── Storage & DB ──
    { id: 'database', category: 'storage', label: 'Database', color: '#10b981', viewBox: '0 0 24 24', path: 'M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-5c0 .5-2.13 2-6 2s-6-1.5-6-2V9.77C7.61 10.55 9.72 11 12 11s4.39-.45 6-1.23V12z' },
    { id: 'rds', category: 'storage', label: 'RDS', color: '#3b82f6', viewBox: '0 0 24 24', path: 'M12 2C8.13 2 5 3.79 5 6v12c0 2.21 3.13 4 7 4s7-1.79 7-4V6c0-2.21-3.13-4-7-4zm0 18c-3.31 0-5-1.34-5-2v-2.77c1.39.84 3.1 1.27 5 1.27s3.61-.43 5-1.27V18c0 .66-1.69 2-5 2zm5-7c0 .66-1.69 2-5 2s-5-1.34-5-2V10.23C8.39 11.07 10.1 11.5 12 11.5s3.61-.43 5-1.27V13zm0-7c0 .66-1.69 2-5 2S7 6.66 7 6s1.69-2 5-2 5 1.34 5 2z' },
    { id: 's3', category: 'storage', label: 'S3 Bucket', color: '#10b981', viewBox: '0 0 24 24', path: 'M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3zm2 14h-4v-2h4v2zm0-4h-4V8h4v4z' },
    { id: 'dynamodb', category: 'storage', label: 'DynamoDB', color: '#3b82f6', viewBox: '0 0 24 24', path: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z' },
    { id: 'redis', category: 'storage', label: 'Redis', color: '#ef4444', viewBox: '0 0 24 24', path: 'M12 3L2 8l10 5 10-5-10-5zM2 16l10 5 10-5v-2L12 19 2 14v2zm0-4l10 5 10-5v-2L12 15 2 10v2z' },
    { id: 'mongodb', category: 'storage', label: 'MongoDB', color: '#10b981', viewBox: '0 0 24 24', path: 'M11.2 2c-.1 0-.2.1-.2.2v.6l-.5.5c-2.8 1.7-4.3 4.6-4.5 7.7v.3c.1 3.5 2.3 6.7 5.7 8l.5.2v2.3c0 .1.1.2.2.2h1c.1 0 .2-.1.2-.2v-2.3l.5-.2c3.4-1.3 5.6-4.5 5.7-8v-.3c-.2-3.1-1.7-6-4.5-7.7l-.5-.5v-.6c0-.1-.1-.2-.2-.2h-3.4z' },
    { id: 'elastic', category: 'storage', label: 'ElasticSearch', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
    { id: 'objectstore', category: 'storage', label: 'Object Store', color: '#a855f7', viewBox: '0 0 24 24', path: 'M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zM2 14h20v-4H2v4zm2-3h2v2H4v-2z' },
    { id: 'cache', category: 'storage', label: 'Cache', color: '#f97316', viewBox: '0 0 24 24', path: 'M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 1.45-.39 2.81-1.07 3.97l1.46 1.46C21.39 15.93 22 14.04 22 12c0-4.97-3.64-9.09-8.4-9.85L13 2.05zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V3.03C6.06 3.55 2 7.95 2 12c0 5.52 4.48 10 10 10 2.04 0 3.93-.61 5.51-1.66l-1.46-1.46C14.81 19.59 13.45 20 12 20v-1z' },

    // ── Networking ──
    { id: 'loadbalancer', category: 'network', label: 'Load Balancer', color: '#8b5cf6', viewBox: '0 0 24 24', path: 'M12 2L4 7v5l8 5 8-5V7l-8-5zm0 2.18l5.58 3.49v3.66L12 14.82 6.42 11.33V7.67L12 4.18zM2 19h20v2H2v-2z' },
    { id: 'firewall', category: 'network', label: 'Firewall', color: '#ef4444', viewBox: '0 0 24 24', path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l4 2v4h-3v4l-4-6h3V5z' },
    { id: 'cdn', category: 'network', label: 'CDN', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v2h-2V6zm0 4h2v8h-2v-8z' },
    { id: 'cloudfront', category: 'network', label: 'CloudFront', color: '#8b5cf6', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
    { id: 'dns', category: 'network', label: 'DNS / Route53', color: '#10b981', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.26 0 2.44.3 3.49.84L12 7.6 8.51 4.84C9.56 4.3 10.74 4 12 4zm-6 8c0-1.26.3-2.44.84-3.49L10.4 12l-3.56 3.49C6.3 14.44 6 13.26 6 12zm6 6c-1.26 0-2.44-.3-3.49-.84L12 13.6l3.49 3.56C14.44 17.7 13.26 18 12 18zm6-6c0 1.26-.3 2.44-.84 3.49L13.6 12l3.56-3.49c.54 1.05.84 2.23.84 3.49z' },
    { id: 'vpn', category: 'network', label: 'VPN', color: '#a855f7', viewBox: '0 0 24 24', path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z' },
    { id: 'gateway', category: 'network', label: 'API Gateway', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7.58 4.14v6.36L12 18.82l-7.58-4.14V8.32L12 4.18z' },
    { id: 'vpc', category: 'network', label: 'VPC', color: '#0ea5e9', viewBox: '0 0 24 24', path: 'M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7zm2 2v6h6V9H9z' },

    // ── DevOps & CI/CD ──
    { id: 'github', category: 'devops', label: 'GitHub', color: '#f1f5f9', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.16.58.67.48C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z' },
    { id: 'cicd', category: 'devops', label: 'CI/CD Pipeline', color: '#10b981', viewBox: '0 0 24 24', path: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z' },
    { id: 'codepipeline', category: 'devops', label: 'Pipeline', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M3 12l4-4v3h10V8l4 4-4 4v-3H7v3l-4-4z' },
    { id: 'git', category: 'devops', label: 'Git', color: '#ef4444', viewBox: '0 0 24 24', path: 'M2.6 10.59l8.38-8.38c.78-.78 2.05-.78 2.83 0l1.4 1.4-1.77 1.77c-.67-.25-1.44-.08-1.97.45s-.7 1.3-.45 1.97L9.26 9.57c-.67-.25-1.44-.08-1.97.45-.78.78-.78 2.05 0 2.83s2.05.78 2.83 0c.55-.55.71-1.37.42-2.05l1.7-1.7v4.59c-.22.11-.43.25-.6.43-.78.78-.78 2.05 0 2.83s2.05.78 2.83 0c.78-.78.78-2.05 0-2.83-.23-.23-.49-.39-.78-.5V9.17c.28-.11.55-.28.78-.5.56-.56.7-1.38.43-2.06l1.75-1.75 5.02 5.02c.78.78.78 2.05 0 2.83l-8.38 8.38c-.78.78-2.05.78-2.83 0L2.6 13.41c-.78-.78-.78-2.05 0-2.83z' },
    { id: 'terraform', category: 'devops', label: 'Terraform', color: '#8b5cf6', viewBox: '0 0 24 24', path: 'M1 3h7v7H1V3zm8 0h7v7H9V3zm8 0h7v7h-7V3zM9 12h7v7H9v-7z' },
    { id: 'codebuild', category: 'devops', label: 'Build', color: '#10b981', viewBox: '0 0 24 24', path: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
    { id: 'deploy', category: 'devops', label: 'Deploy', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z' },
    { id: 'monitoring', category: 'devops', label: 'Monitoring', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z' },
    { id: 'logging', category: 'devops', label: 'Logging', color: '#84cc16', viewBox: '0 0 24 24', path: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-4h8v2H8v-2z' },

    // ── Security ──
    { id: 'lock', category: 'security', label: 'Auth / Lock', color: '#ef4444', viewBox: '0 0 24 24', path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z' },
    { id: 'shield', category: 'security', label: 'Shield / WAF', color: '#10b981', viewBox: '0 0 24 24', path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
    { id: 'iam', category: 'security', label: 'IAM', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
    { id: 'key', category: 'security', label: 'KMS / Key', color: '#a855f7', viewBox: '0 0 24 24', path: 'M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
    { id: 'certificate', category: 'security', label: 'SSL / Cert', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },

    // ── Messaging ──
    { id: 'queue', category: 'messaging', label: 'Queue / SQS', color: '#f97316', viewBox: '0 0 24 24', path: 'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2zM2 4v2h2V4H2zm0 5v2h2V9H2zm0 5v2h2v-2H2z' },
    { id: 'sns', category: 'messaging', label: 'SNS / Pub-Sub', color: '#ef4444', viewBox: '0 0 24 24', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2v-2zm0-10h2v8h-2V6z' },
    { id: 'kafka', category: 'messaging', label: 'Kafka', color: '#06b6d4', viewBox: '0 0 24 24', path: 'M4 4h16v16H4V4zm4 3v10h2V7H8zm4 2v6h2V9h-2zm4 1v4h2v-4h-2z' },
    { id: 'eventbridge', category: 'messaging', label: 'Event Bus', color: '#ec4899', viewBox: '0 0 24 24', path: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z' },
    { id: 'webhook', category: 'messaging', label: 'Webhook', color: '#14b8a6', viewBox: '0 0 24 24', path: 'M10 15l5.88-3L10 9v6zm11.54-7.17C21.14 6.24 19.82 5 18 5H6c-1.82 0-3.14 1.24-3.54 2.83-.12.47.26.92.74.92.34 0 .63-.23.72-.56C4.22 7.05 5.02 6.5 6 6.5h12c.98 0 1.78.55 2.08 1.69.09.33.38.56.72.56.48 0 .86-.45.74-.92zM21 17H3v-2h18v2z' },
    { id: 'notification', category: 'messaging', label: 'Notification', color: '#f59e0b', viewBox: '0 0 24 24', path: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z' },
];
