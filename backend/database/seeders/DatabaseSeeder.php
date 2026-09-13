<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Artist;
use App\Models\Genre;
use App\Models\Language;
use App\Models\Album;
use App\Models\Song;
use App\Models\SongStory;
use App\Models\Lyric;
use App\Models\Playlist;
use App\Models\AudioVariant;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Languages
        $languages = [
            ['name' => 'Assamese', 'code' => 'as'],
            ['name' => 'Hindi', 'code' => 'hi'],
            ['name' => 'Bengali', 'code' => 'bn'],
            ['name' => 'English', 'code' => 'en'],
        ];
        foreach ($languages as $l) {
            Language::firstOrCreate(['code' => $l['code']], $l);
        }

        // 2. Genres
        $genres = [
            ['name' => 'Modern Assamese', 'slug' => 'modern-assamese', 'icon_name' => 'music'],
            ['name' => 'Bihu', 'slug' => 'bihu', 'icon_name' => 'disc'],
            ['name' => 'Assamese Folk', 'slug' => 'assamese-folk', 'icon_name' => 'radio'],
            ['name' => 'Bollywood', 'slug' => 'bollywood', 'icon_name' => 'film'],
            ['name' => 'Rock & Fusion', 'slug' => 'rock-fusion', 'icon_name' => 'zap'],
            ['name' => 'Romantic Melodies', 'slug' => 'romantic', 'icon_name' => 'heart'],
            ['name' => 'Sufi & Soul', 'slug' => 'sufi-soul', 'icon_name' => 'feather'],
        ];
        foreach ($genres as $g) {
            Genre::firstOrCreate(['slug' => $g['slug']], $g);
        }

        // 3. Super Admin & Listener
        $admin = User::firstOrCreate(
            ['email' => 'admin@zubeenplayer.com'],
            [
                'name' => 'Platform Administrator',
                'password' => Hash::make('AdminPassword123!'),
                'role' => 'SUPER_ADMIN',
                'avatar_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Lead System Administrator and Content Quality Lead at Zubeen Player.',
            ]
        );

        $listener = User::firstOrCreate(
            ['email' => 'listener@zubeenplayer.com'],
            [
                'name' => 'Partha Pratim',
                'password' => Hash::make('ListenerPassword123!'),
                'role' => 'LISTENER',
                'avatar_url' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Music lover from Guwahati, Assam. Devoted fan of Zubeen Garg.',
            ]
        );

        // 4. Zubeen Garg (Artist & User)
        $zubeenUser = User::firstOrCreate(
            ['email' => 'zubeen@zubeenplayer.com'],
            [
                'name' => 'Zubeen Garg',
                'password' => Hash::make('ArtistPassword123!'),
                'role' => 'ARTIST',
                'avatar_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
                'bio' => 'Assamese music icon, singer, composer, lyricist, music director, and cultural visionary.',
            ]
        );

        $zubeenArtist = Artist::firstOrCreate(
            ['user_id' => $zubeenUser->id],
            [
                'name' => 'Zubeen Garg',
                'slug' => 'zubeen-garg',
                'profile_image_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
                'banner_image_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
                'biography' => 'Zubeen Garg is an Indian singer, music director, composer, lyricist, music producer, actor, and filmmaker from Assam. Having sung over 32,000 songs in multiple Indian languages, his voice defines modern Assamese music and Bollywood blockbusters like Ya Ali.',
                'genres' => ['Modern Assamese', 'Rock & Fusion', 'Bollywood', 'Bihu'],
                'languages' => ['Assamese', 'Hindi', 'Bengali'],
                'website' => 'https://zubeengarg.in',
                'social_links' => [
                    'instagram' => 'https://instagram.com/zubeen.garg',
                    'youtube' => 'https://youtube.com/@ZubeenGargOfficial'
                ],
                'verified' => true,
                'total_streams' => 14850000,
                'monthly_listeners' => 840000,
                'followers_count' => 520000,
                'is_rising' => false,
            ]
        );

        // 5. Papon (Artist & User)
        $paponUser = User::firstOrCreate(
            ['email' => 'papon@zubeenplayer.com'],
            [
                'name' => 'Angaraag Papon Mahanta',
                'password' => Hash::make('ArtistPassword123!'),
                'role' => 'ARTIST',
                'avatar_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                'bio' => 'Singer, composer, and multi-instrumentalist from Assam.',
            ]
        );

        $paponArtist = Artist::firstOrCreate(
            ['user_id' => $paponUser->id],
            [
                'name' => 'Papon',
                'slug' => 'papon',
                'profile_image_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                'banner_image_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80',
                'biography' => 'Angaraag Mahanta, known by his stage name Papon, is an Indian playback singer and composer known for his soulful renditions and fusion of folk music.',
                'genres' => ['Assamese Folk', 'Sufi & Soul', 'Bollywood'],
                'languages' => ['Assamese', 'Hindi'],
                'verified' => true,
                'total_streams' => 8900000,
                'monthly_listeners' => 620000,
                'followers_count' => 310000,
                'is_rising' => false,
            ]
        );

        // 6. Neel Akash (Rising Artist)
        $neelUser = User::firstOrCreate(
            ['email' => 'neelakash@zubeenplayer.com'],
            [
                'name' => 'Neel Akash',
                'password' => Hash::make('ArtistPassword123!'),
                'role' => 'ARTIST',
                'avatar_url' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
                'bio' => 'New-wave energetic Bihu & Assamese romantic vocal sensation.',
            ]
        );

        $neelArtist = Artist::firstOrCreate(
            ['user_id' => $neelUser->id],
            [
                'name' => 'Neel Akash',
                'slug' => 'neel-akash',
                'profile_image_url' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
                'banner_image_url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
                'biography' => 'Neel Akash has emerged as one of Assam\'s most beloved young voices, revolutionizing youth romantic folk and celebratory festival melodies.',
                'genres' => ['Bihu', 'Modern Assamese', 'Romantic Melodies'],
                'languages' => ['Assamese'],
                'verified' => true,
                'total_streams' => 2400000,
                'monthly_listeners' => 310000,
                'followers_count' => 145000,
                'is_rising' => true, // Rising artist showcase
            ]
        );

        // 7. Zubeen Albums
        $anamika = Album::firstOrCreate(
            ['slug' => 'anamika'],
            [
                'artist_id' => $zubeenArtist->id,
                'title' => 'Anamika',
                'cover_url' => 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80',
                'description' => 'The epoch-making debut solo album that established Zubeen Garg as a cultural phenomenon across Northeast India.',
                'genre' => 'Modern Assamese',
                'language' => 'Assamese',
                'release_year' => 1992,
                'release_date' => '1992-11-15',
                'songs_count' => 2,
                'status' => 'PUBLISHED',
            ]
        );

        $maya = Album::firstOrCreate(
            ['slug' => 'maya'],
            [
                'artist_id' => $zubeenArtist->id,
                'title' => 'Maya',
                'cover_url' => 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                'description' => 'The timeless record featuring iconic Assamese hits that touched generations with soulful poetry and sweeping arrangements.',
                'genre' => 'Modern Assamese',
                'language' => 'Assamese',
                'release_year' => 1994,
                'release_date' => '1994-04-14',
                'songs_count' => 2,
                'status' => 'PUBLISHED',
            ]
        );

        $monJaai = Album::firstOrCreate(
            ['slug' => 'mon-jaai'],
            [
                'artist_id' => $zubeenArtist->id,
                'title' => 'Mon Jaai',
                'cover_url' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
                'description' => 'Soundtrack of the acclaimed National Award-winning Assamese motion picture directed by and starring Zubeen Garg.',
                'genre' => 'Rock & Fusion',
                'language' => 'Assamese',
                'release_year' => 2008,
                'release_date' => '2008-09-12',
                'songs_count' => 2,
                'status' => 'PUBLISHED',
            ]
        );

        // 8. Songs Catalog with Real Audio Streams, Stories, Lyrics
        $sampleStream = 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg'; // High quality accessible baseline audio stream

        $songsData = [
            [
                'title' => 'Maya Mathu Maya',
                'slug' => 'maya-mathu-maya',
                'artist_id' => $zubeenArtist->id,
                'album_id' => $maya->id,
                'artwork_url' => 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 285,
                'genre' => 'Modern Assamese',
                'language' => 'Assamese',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/1/master.m3u8',
                'play_count' => 1250400,
                'like_count' => 98400,
                'track_number' => 1,
                'story' => [
                    'release_year' => 1994,
                    'composer' => 'Zubeen Garg',
                    'lyricist' => 'Zubeen Garg',
                    'singer' => 'Zubeen Garg',
                    'description' => 'The defining philosophical anthem exploring the illusory nature of human bonds and eternal longing.',
                    'story' => 'Written when Zubeen was just entering his twenties, "Maya Mathu Maya" was composed on an acoustic harmonium late one rainy night in Jorhat. The track transformed contemporary Assamese orchestration by infusing synthesizer arpeggios beneath folk percussion.'
                ],
                'lyrics' => [
                    'language' => 'Assamese',
                    'lyrics_text' => "Maya Mathu Maya ei prithivi maya\nBhalpua mur eti smriti hoiya...\n\nJodihe jana tumi mur ei bedona\nNubujiba kiyo mur antaror kotha?\n\nMaya mathu maya ei dharani maya\nKuhipator soku paatite heruwa...",
                    'synced_data' => [
                        ['time_ms' => 0, 'text' => "Maya Mathu Maya ei prithivi maya"],
                        ['time_ms' => 12000, 'text' => "Bhalpua mur eti smriti hoiya..."],
                        ['time_ms' => 24000, 'text' => "Jodihe jana tumi mur ei bedona"],
                        ['time_ms' => 36000, 'text' => "Nubujiba kiyo mur antaror kotha?"],
                    ]
                ]
            ],
            [
                'title' => 'Anamika',
                'slug' => 'anamika',
                'artist_id' => $zubeenArtist->id,
                'album_id' => $anamika->id,
                'artwork_url' => 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 312,
                'genre' => 'Romantic Melodies',
                'language' => 'Assamese',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/2/master.m3u8',
                'play_count' => 2100800,
                'like_count' => 154000,
                'track_number' => 1,
                'story' => [
                    'release_year' => 1992,
                    'composer' => 'Zubeen Garg',
                    'lyricist' => 'Zubeen Garg',
                    'singer' => 'Zubeen Garg',
                    'description' => 'The romantic ballad that launched a historic musical career.',
                    'story' => 'Recorded on a shoestring budget in 1992, "Anamika" quickly spread by cassette across college campuses, making Zubeen Garg an overnight household name.'
                ],
                'lyrics' => [
                    'language' => 'Assamese',
                    'lyrics_text' => "Anamika... tumi jen eti mukali potharor godhuli baa\nAnamika... tumi jen eti botahe dhowa junor chha\n\nTumi aaha mur bukuroli\nBhalpua di muk rangoli kori tuliba...\nAnamika...",
                    'synced_data' => [
                        ['time_ms' => 0, 'text' => "Anamika... tumi jen eti mukali potharor godhuli baa"],
                        ['time_ms' => 15000, 'text' => "Anamika... tumi jen eti botahe dhowa junor chha"],
                        ['time_ms' => 30000, 'text' => "Tumi aaha mur bukuroli"],
                    ]
                ]
            ],
            [
                'title' => 'Mon Jaai',
                'slug' => 'mon-jaai',
                'artist_id' => $zubeenArtist->id,
                'album_id' => $monJaai->id,
                'artwork_url' => 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 270,
                'genre' => 'Rock & Fusion',
                'language' => 'Assamese',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/3/master.m3u8',
                'play_count' => 1890000,
                'like_count' => 134200,
                'track_number' => 1,
                'story' => [
                    'movie' => 'Mon Jaai',
                    'release_year' => 2008,
                    'composer' => 'Zubeen Garg',
                    'lyricist' => 'Zubeen Garg',
                    'producer' => 'Zubeen Garg',
                    'singer' => 'Zubeen Garg',
                    'description' => 'High-octane rock anthem voicing the passion and restlessness of Northeast youth.',
                    'story' => 'Featured as the title track of the National Film Award-winning drama, "Mon Jaai" combines aggressive electric guitar distortion with traditional Dhol riffs.'
                ],
                'lyrics' => [
                    'language' => 'Assamese',
                    'lyrics_text' => "Mon jaai, mon jaai\nMur ei deha eri uri jabo mon jaai!\nAkashor neelate herai jabo mon jaai!\n\nJodihe jibon eku eti xopun\nKetiyaba lage bhabona mur aapun...",
                    'synced_data' => [
                        ['time_ms' => 0, 'text' => "Mon jaai, mon jaai"],
                        ['time_ms' => 10000, 'text' => "Mur ei deha eri uri jabo mon jaai!"],
                    ]
                ]
            ],
            [
                'title' => 'Ya Ali (Rock Version)',
                'slug' => 'ya-ali-rock',
                'artist_id' => $zubeenArtist->id,
                'album_id' => null,
                'artwork_url' => 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 295,
                'genre' => 'Bollywood',
                'language' => 'Hindi',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/4/master.m3u8',
                'play_count' => 9840200,
                'like_count' => 640000,
                'track_number' => 1,
                'story' => [
                    'movie' => 'Gangster',
                    'release_year' => 2006,
                    'composer' => 'Pritam',
                    'lyricist' => 'Sayeed Quadri',
                    'singer' => 'Zubeen Garg',
                    'description' => 'The chart-topping nationwide blockbuster that earned Zubeen Garg the Global Indian Film Award.',
                    'story' => 'Recorded in Mumbai with Mahesh Bhatt and Pritam, this intense rock anthem stayed #1 across Indian radio countdowns for over 26 consecutive weeks.'
                ],
                'lyrics' => [
                    'language' => 'Hindi',
                    'lyrics_text' => "Ya Ali reham wali\nYa Ali yaara meharbaani ve...\n\nAgar tu hota toh na aate ye aansoo\nKhuda bhi rootha sa lagta hai mujhko\nYa Ali...",
                    'synced_data' => [
                        ['time_ms' => 0, 'text' => "Ya Ali reham wali"],
                        ['time_ms' => 14000, 'text' => "Ya Ali yaara meharbaani ve..."],
                    ]
                ]
            ],
            [
                'title' => 'Dinae Dinae',
                'slug' => 'dinae-dinae',
                'artist_id' => $paponArtist->id,
                'album_id' => null,
                'artwork_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 310,
                'genre' => 'Assamese Folk',
                'language' => 'Assamese',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/5/master.m3u8',
                'play_count' => 840000,
                'like_count' => 54000,
                'track_number' => 1,
                'story' => [
                    'release_year' => 2017,
                    'composer' => 'Traditional / Papon',
                    'singer' => 'Papon',
                    'description' => 'A haunting reimagining of Goalparia folk traditions exploring transient time.',
                    'story' => 'Papon blended traditional dotara and flute with ambient cello arrangements to create this contemporary folk masterpiece.'
                ],
                'lyrics' => [
                    'language' => 'Assamese',
                    'lyrics_text' => "Dinae dinae khasiya poribo\nO mur dehar baashor khati re...\n\nDinae dinae khasiya poribo...",
                    'synced_data' => []
                ]
            ],
            [
                'title' => 'Oi Jaan Mon',
                'slug' => 'oi-jaan-mon',
                'artist_id' => $neelArtist->id,
                'album_id' => null,
                'artwork_url' => 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
                'duration_seconds' => 240,
                'genre' => 'Bihu',
                'language' => 'Assamese',
                'stream_url' => $sampleStream,
                'hls_master_url' => '/storage/hls/songs/6/master.m3u8',
                'play_count' => 670000,
                'like_count' => 48200,
                'track_number' => 1,
                'story' => [
                    'release_year' => 2025,
                    'composer' => 'Neel Akash',
                    'singer' => 'Neel Akash',
                    'description' => 'Modern energetic Rongali Bihu festival sensation.',
                    'story' => 'A viral sensation across Assam during spring festivals with lively pepa and dhol arrangements.'
                ],
                'lyrics' => [
                    'language' => 'Assamese',
                    'lyrics_text' => "Oi jaan mon tate morom\nOi jaan mon bukut ghorom...\nBohagor botahe koliyaa kore morom...",
                    'synced_data' => []
                ]
            ]
        ];

        foreach ($songsData as $sData) {
            $storyData = $sData['story'] ?? null;
            $lyricsData = $sData['lyrics'] ?? null;
            unset($sData['story'], $sData['lyrics']);

            $song = Song::firstOrCreate(['slug' => $sData['slug']], $sData);

            if ($storyData) {
                SongStory::firstOrCreate(['song_id' => $song->id], array_merge(['song_id' => $song->id], $storyData));
            }

            if ($lyricsData) {
                Lyric::firstOrCreate(['song_id' => $song->id], array_merge(['song_id' => $song->id], $lyricsData));
            }

            // Create HLS Audio Variants for 64k, 128k, 192k, 320k
            $bitrates = ['64k' => 64000, '128k' => 128000, '192k' => 192000, '320k' => 320000];
            foreach ($bitrates as $rate => $bw) {
                AudioVariant::firstOrCreate(
                    ['song_id' => $song->id, 'bitrate' => $rate],
                    [
                        'format' => 'aac',
                        'hls_playlist_url' => "/storage/hls/songs/{$song->id}/{$rate}/prog_index.m3u8",
                        'bandwidth' => $bw,
                        'duration_seconds' => $song->duration_seconds,
                        'file_size' => (int)(($bw / 8) * $song->duration_seconds),
                    ]
                );
            }
        }

        // Link album songs
        $anamikaSong = Song::where('slug', 'anamika')->first();
        if ($anamikaSong) {
            $anamika->songs()->syncWithoutDetaching([$anamikaSong->id => ['track_number' => 1]]);
        }
        $mayaSong = Song::where('slug', 'maya-mathu-maya')->first();
        if ($mayaSong) {
            $maya->songs()->syncWithoutDetaching([$mayaSong->id => ['track_number' => 1]]);
        }
        $monJaaiSong = Song::where('slug', 'mon-jaai')->first();
        if ($monJaaiSong) {
            $monJaai->songs()->syncWithoutDetaching([$monJaaiSong->id => ['track_number' => 1]]);
        }

        // 9. Playlists
        $playlist1 = Playlist::firstOrCreate(
            ['title' => 'Legendary Hits of Zubeen Garg'],
            [
                'user_id' => $admin->id,
                'description' => 'A handpicked compilation of timeless melodies from the maestro Zubeen Garg.',
                'cover_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
                'visibility' => 'PUBLIC',
                'songs_count' => 4,
            ]
        );
        $playlist1->songs()->syncWithoutDetaching(Song::where('artist_id', $zubeenArtist->id)->pluck('id'));

        $playlist2 = Playlist::firstOrCreate(
            ['title' => 'Assam Acoustic & Soul'],
            [
                'user_id' => $admin->id,
                'description' => 'Unwind with organic acoustic guitars, tranquil folk flutes, and soothing vocals.',
                'cover_url' => 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
                'visibility' => 'PUBLIC',
                'songs_count' => 2,
            ]
        );
        $playlist2->songs()->syncWithoutDetaching(Song::whereIn('slug', ['maya-mathu-maya', 'dinae-dinae'])->pluck('id'));
    }
}
