class DurationParser {
    static parse(durationString) {
        const units = {
            s: 1000,
            sec: 1000,
            second: 1000,
            seconds: 1000,
            m: 60 * 1000,
            min: 60 * 1000,
            minute: 60 * 1000,
            minutes: 60 * 1000,
            h: 60 * 60 * 1000,
            hr: 60 * 60 * 1000,
            hour: 60 * 60 * 1000,
            hours: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            weeks: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            months: 30 * 24 * 60 * 60 * 1000,
            y: 365 * 24 * 60 * 60 * 1000,
            year: 365 * 24 * 60 * 60 * 1000,
            years: 365 * 24 * 60 * 60 * 1000
        };

        const regex = /(\d+(?:\.\d+)?)\s*([a-z]+)/gi;
        let totalMs = 0;
        let match;
        let hasMatch = false;

        while ((match = regex.exec(durationString)) !== null) {
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();

            if (units[unit]) {
                totalMs += value * units[unit];
                hasMatch = true;
            } else {
                throw new Error(`Invalid duration unit: ${unit}`);
            }
        }

        if (!hasMatch) {
            throw new Error('Invalid duration format. Use formats like: 2h, 30m, 5d, 1month');
        }

        if (totalMs <= 0) {
            throw new Error('Duration must be greater than 0');
        }

        if (totalMs > 365 * 24 * 60 * 60 * 1000) {
            throw new Error('Duration cannot exceed 1 year');
        }

        return totalMs;
    }

    static format(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);

        if (months > 0) {
            const remainingDays = days % 30;
            return remainingDays > 0 
                ? `${months} month${months > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
                : `${months} month${months > 1 ? 's' : ''}`;
        } else if (days > 0) {
            const remainingHours = hours % 24;
            return remainingHours > 0 
                ? `${days} day${days > 1 ? 's' : ''}, ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
                : `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 
                ? `${hours} hour${hours > 1 ? 's' : ''}, ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
                : `${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 
                ? `${minutes} minute${minutes > 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`
                : `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
    }

    static formatShort(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);

        if (months > 0) return `${months}mo`;
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    static toTimestamp(milliseconds) {
        return Math.floor((Date.now() + milliseconds) / 1000);
    }
}

module.exports = DurationParser;
