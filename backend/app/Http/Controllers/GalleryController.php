<?php
// app/Http/Controllers/GalleryController.php

namespace App\Http\Controllers;

use App\Http\Resources\GalleryResource;
use App\Services\Gallery\GalleryService;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    public function __construct(protected GalleryService $galleryService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $this->galleryService->getUserGalleryData($user);

        return new GalleryResource($data);
    }
}
