module.exports = {
  apps: [
    {
      name: "tickrmeter-handler",
      script: "build/index.js",
      instances: "max", // Cluster mode with as many instances as there are CPU cores
      exec_mode: "cluster",
      watch: false, // Disable file watching for production
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tickrmeter-device-boot",
      script: "build/device_boot.js",
      instances: "max", // Cluster mode
      exec_mode: "cluster",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "tickrmeter-cron-jobs",
      script: "build/cron_jobs.js",
      instances: 1, // Only one instance, as we don't need cluster mode for this
      exec_mode: "fork", // Fork mode (no clustering)
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
