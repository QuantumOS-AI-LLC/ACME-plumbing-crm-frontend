// Fake job data generator for contact job history
export const generateFakeJobsForContact = (
    contactId,
    contactName,
    contactAddress
) => {
    const jobTypes = [
        "Kitchen Sink Repair",
        "Bathroom Renovation",
        "Water Heater Installation",
        "Toilet Replacement",
        "Pipe Leak Repair",
        "Drain Cleaning",
        "Faucet Installation",
        "Shower Head Replacement",
        "Garbage Disposal Repair",
        "Main Line Cleaning",
        "Sump Pump Installation",
        "Water Line Repair",
        "Bathroom Remodel",
        "Kitchen Plumbing Upgrade",
        "Emergency Pipe Burst",
        "Backflow Prevention",
        "Water Pressure Issue",
        "Clogged Drain Service",
        "Hot Water Tank Service",
        "Plumbing Inspection",
        "Bathtub Installation",
        "Dishwasher Connection",
        "Washing Machine Hookup",
        "Gas Line Installation",
        "Septic Tank Pumping",
        "Frozen Pipe Repair",
        "Sewer Line Replacement",
        "Water Softener Installation",
        "Outdoor Spigot Repair",
        "Basement Waterproofing",
        "Toilet Clog Removal",
        "Shower Valve Replacement",
        "Kitchen Repiping",
        "Bathroom Floor Drain",
        "Water Meter Installation",
        "Pipe Insulation Service",
        "Hydro Jetting Service",
        "Fixture Replacement",
        "Leak Detection Service",
        "Emergency Shutoff Repair",
    ];

    const statuses = ["open", "in_progress", "completed", "cancelled"];
    const activities = [
        "on_the_way",
        "has_arrived",
        "job_started",
        "job_completed",
        "invoice_sent",
        "invoice_paid",
        "request_review",
    ];

    const getRandomDate = (start, end) => {
        return new Date(
            start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
    };

    const getRandomPrice = () => {
        return Math.floor(Math.random() * 2000) + 150; // $150 - $2150
    };

    const getRandomProgress = () => {
        return Math.floor(Math.random() * 101); // 0-100%
    };

    // Generate 20-25 jobs per contact to ensure each status has more than 5 jobs
    const numJobs = Math.floor(Math.random() * 6) + 20;
    const jobs = [];

    for (let i = 0; i < numJobs; i++) {
        const jobId = `job_${contactId}_${i + 1}`;

        // Ensure each status has at least 6 jobs by distributing them more evenly
        let status;
        if (i < 6) status = "open";
        else if (i < 12) status = "in_progress";
        else if (i < 18) status = "completed";
        else if (i < 20) status = "cancelled";
        else status = statuses[Math.floor(Math.random() * statuses.length)];
        const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
        const price = getRandomPrice();
        const progress =
            status === "in_progress"
                ? getRandomProgress()
                : status === "completed"
                ? 100
                : 0;

        // Generate realistic dates
        const createdDate = getRandomDate(new Date(2023, 0, 1), new Date());
        const startDate =
            status !== "open" ? getRandomDate(createdDate, new Date()) : null;
        const endDate =
            status === "completed"
                ? getRandomDate(startDate || createdDate, new Date())
                : null;
        const dueDate =
            status === "open" || status === "in_progress"
                ? getRandomDate(
                      new Date(),
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  )
                : null;

        const job = {
            id: jobId,
            name: jobType,
            status: status,
            price: price,
            bidAmount: price,
            progress: progress,
            client: {
                id: contactId,
                name: contactName,
            },
            clientId: contactId,
            address:
                contactAddress ||
                `${Math.floor(Math.random() * 9999) + 1} Main St, City, State`,
            createdAt: createdDate.toISOString(),
            startDate: startDate?.toISOString() || null,
            endDate: endDate?.toISOString() || null,
            completedDate: endDate?.toISOString() || null,
            dueDate: dueDate?.toISOString() || null,
            activity: activities[Math.floor(Math.random() * activities.length)],
            leadStatus:
                activities[Math.floor(Math.random() * activities.length)],
            createdBy: "system",
            description: `${jobType} service for ${contactName}`,
            notes: `Professional ${jobType.toLowerCase()} service with quality guarantee.`,
        };

        jobs.push(job);
    }

    // Sort jobs by creation date (newest first)
    return jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Filter jobs by status
export const filterJobsByStatus = (jobs, status) => {
    if (!status) return jobs;
    return jobs.filter((job) => job.status === status);
};

// Get job counts by status
export const getJobCountsByStatus = (jobs) => {
    return {
        open: jobs.filter((job) => job.status === "open").length,
        in_progress: jobs.filter((job) => job.status === "in_progress").length,
        completed: jobs.filter((job) => job.status === "completed").length,
        cancelled: jobs.filter((job) => job.status === "cancelled").length,
        total: jobs.length,
    };
};
