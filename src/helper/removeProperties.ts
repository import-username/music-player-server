export default function removeProperties(query: object | object[], ...args: string[]): object | object[] {
    if (Array.isArray(query)) {
        return query.map((item: object) => {
            let rowObj = {};

            for (let i in item) {
                if (!args.includes(i)) {
                    rowObj[i] = item[i];
                }
            }

            return rowObj;
        })
    } else if (typeof query === "object") {
        let rowObj = {};

        for (let i in query) {
            if (!args.includes(i)) {
                rowObj[i] = query[i];
            }
        }

        return rowObj;
    }
}