<?php
// app/Http/Controllers/Admin/RoomController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\StoreRoomRequest;
use App\Services\Admin\RoomService;

class RoomController extends Controller
{
    protected $roomService;

    public function __construct(RoomService $roomService)
    {
        $this->roomService = $roomService;
    }

    public function index()
    {
        return response()->json($this->roomService->getAllRooms());
    }

    public function show(string $id)
    {
        $room = $this->roomService->getRoom($id);

        return response()->json($room, 200);
    }

    public function store(StoreRoomRequest $request)
    {
        try {
            $ownerName = $request->user()->username;
            $roomData = $this->roomService->createRoom($request->validated(), $ownerName);

            return response()->json($roomData, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 400);
        }
    }
}
