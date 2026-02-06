import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db, ensureSchema } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        await ensureSchema();

        // Auth Check
        const cookieStore = await cookies();
        const session = cookieStore.get('admin_session');
        let user = null;
        if (session) {
            try {
                user = JSON.parse(session.value);
            } catch (e) {
                if (session.value === 'true') user = { id: 'root', role: 'root' };
            }
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Round Ownership
        const roundRes = await db.execute({
            sql: 'SELECT user_id FROM rounds WHERE slug = ?',
            args: [slug]
        });

        if (roundRes.rows.length === 0) {
            return NextResponse.json({ error: 'Round not found' }, { status: 404 });
        }

        const round = roundRes.rows[0];
        if (user.role !== 'root') {
            // If round has owner and it's not us (or round has no owner and we aren't root? assume old rounds are root owned or public?)
            // If round.user_id is NULL, only root can edit? Or anyone?
            // Safer: If round.user_id exists, must match. If null, assume root.
            if (round.user_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // 1. Check if matches already exist
        const existingMatches = await db.execute({
            sql: 'SELECT COUNT(*) as count FROM matches WHERE round_slug = ?',
            args: [slug]
        });

        if ((existingMatches.rows[0].count as number) > 0) {
            return NextResponse.json({ error: 'Matches already generated' }, { status: 400 });
        }

        // 2. Fetch all players
        const playersRes = await db.execute({
            sql: 'SELECT * FROM players WHERE round_slug = ? ORDER BY id ASC',
            args: [slug]
        });
        const players = playersRes.rows;

        if (players.length < 2) {
            return NextResponse.json({ error: 'Not enough players to generate matches' }, { status: 400 });
        }

        // 3. Generate Round Robin (Circle Method)
        const matches = [];
        const playerIds = players.map(p => p.id);
        const n = playerIds.length;

        // If odd number of players, add a dummy ID (-1) for "Bye"
        if (n % 2 !== 0) {
            playerIds.push(-1); // -1 indicates a bye
        }

        const totalPlayers = playerIds.length;
        const numRounds = totalPlayers - 1;
        const matchesPerRound = totalPlayers / 2;

        for (let round = 0; round < numRounds; round++) {
            for (let match = 0; match < matchesPerRound; match++) {
                const p1 = playerIds[match];
                const p2 = playerIds[totalPlayers - 1 - match];

                // If neither is a dummy "Bye" player, create the match
                if (p1 !== -1 && p2 !== -1) {
                    matches.push({
                        sql: 'INSERT INTO matches (round_slug, pair1_id, pair2_id, match_round) VALUES (?, ?, ?, ?)',
                        args: [slug, p1, p2, round + 1]
                    });
                }
            }

            // Rotate the array (keep first element fixed, rotate the rest)
            // Array: [0, 1, 2, 3] -> [0, 3, 1, 2] -> [0, 2, 3, 1]
            const last = playerIds.pop();
            if (last !== undefined) {
                playerIds.splice(1, 0, last);
            }
        }

        // 4. Insert matches using batch
        if (matches.length > 0) {
            await db.batch(matches, "write");
        }

        return NextResponse.json({ success: true, count: matches.length });

    } catch (error) {
        console.error("Match generation error:", error);
        return NextResponse.json({ error: 'Failed to generate matches' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    try {
        await ensureSchema();
        // Join with players table to get names
        const result = await db.execute({
            sql: `
                SELECT 
                    m.*, 
                    p1.player1 as p1_p1, p1.player2 as p1_p2,
                    p2.player1 as p2_p1, p2.player2 as p2_p2
                FROM matches m
                JOIN players p1 ON m.pair1_id = p1.id
                JOIN players p2 ON m.pair2_id = p2.id
                WHERE m.round_slug = ?
                ORDER BY m.id ASC
            `,
            args: [slug]
        });

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Get matches error:", error);
        return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}
