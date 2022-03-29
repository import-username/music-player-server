export default function isHttpStatusOk(status: number): boolean {
    return (status > 199 && status < 300);
}