<?php
// app/Http/Controllers/Admin/RoomController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\StoreRoomRequest;
use App\Services\Admin\RoomService;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    protected $roomService;

    public function __construct(RoomService $roomService)
    {
        $this->roomService = $roomService;
    }

    public function index()
    {
        $allRooms = $this->roomService->getAllRooms();

        return response()->json(array_values($allRooms), 200);
    }

    public function show(string $id)
    {
        $room = $this->roomService->getRoom($id);

        return response()->json($room, 200);
    }

    public function store(StoreRoomRequest $request)
    {
        try {
            $user = $request->user();


            $roomData = $this->roomService->createRoom(
                $request->validated(),
                (string) $user->id,
                $user->username,
                $user->role === 'admin'
            );

            return response()->json($roomData, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }
}
