export const dynamic = 'force-dynamic';

export function GET(request) {
  const { search } = new URL(request.url);
  return new Response(null, { status: 308, headers: { Location: `/${search}` } });
}
