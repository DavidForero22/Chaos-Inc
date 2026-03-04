<?php

namespace App\Http\Controllers;

use App\Http\Requests\Room\StoreRoomRequest;
use App\Services\RoomService;

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
        $ownerName = $request->user()->username;
        $roomData = $this->roomService->createRoom($request->validated(), $ownerName);

        return response()->json($roomData, 201);
    }
}
